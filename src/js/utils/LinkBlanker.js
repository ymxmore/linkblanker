/*
 * LinkBlanker.js
 */

/**
 * Export the constructor.
 */
module.exports = LinkBlanker;

/**
 * LinkBlanker active instance.
 */
var _this;

/**
 * Constructor
 */
function LinkBlanker (chrome) {
  this.chrome = chrome;
  this.manifest = {};
  this.tabLogs = {};

  initialize.apply(this);
}

function initialize () {
  _this = this;

  dataMigration();

  _this.chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    _this.updateStatus(tab);
  });

  _this.chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    _this.deleteTabLog(tabId);
  });

  _this.chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(_this.receiveMessages[port.name]);
  });

  loadManifest.apply(self);

  _this.notifyAllTabs();
}

function loadManifest () {
  var url = _this.chrome.extension.getURL('/manifest.json'),
    xhr = new XMLHttpRequest();

  xhr.onload = function(){
    _this.manifest = JSON.parse(xhr.responseText);
  };

  xhr.open('GET', url, true);
  xhr.send(null);
}

function dataMigration () {
  // 反転する
  if ('disabled-extension' in localStorage) {
    var value = Number(localStorage['disabled-extension'] || '0');
    localStorage['enabled-extension'] = (0 === value) ? 1 : 0;
    delete localStorage['disabled-extension'];
  }
}

LinkBlanker.prototype.getData = function () {
  return {
    'enabled-extension': Number(localStorage['enabled-extension'] || '1'),
    'disabled-domain': JSON.parse(localStorage['disabled-domain'] || '[]'),
    'disabled-directory': JSON.parse(localStorage['disabled-directory'] || '[]'),
    'disabled-page': JSON.parse(localStorage['disabled-page'] || '[]'),
    'enabled-background-open': Number(localStorage['enabled-background-open'] || '0'),
    'enabled-multiclick-close': Number(localStorage['enabled-multiclick-close'] || '0'),
    'shortcut-key-toggle-enabled': localStorage['shortcut-key-toggle-enabled'] || '',
    'disabled-same-domain': Number(localStorage['disabled-same-domain'] || '0'),
  };
};

LinkBlanker.prototype.setData = function (key, value, callback) {
  var all  = _this.getData();
  var data = {};

  if ('object' === typeof key) {
    data = key;
  } else if ('function' !== typeof value) {
    data[key] = value;
  }

  if (!callback && 'function' === typeof value) {
    callback = value;
  }

  _this.currentData(function(result) {
    Object.keys(data).forEach(function (k) {
      var v = data[k];

      switch (k) {
        case 'disabled-domain':
        case 'disabled-directory':
        case 'disabled-page':
          var item  = _this.preferenceValueFromId(k, result);
          var index = all[k].indexOf(item);

          if (v) {
            if (-1 === index) {
              all[k].push(item);
            }
          } else {
            if (index > -1) {
              all[k].splice(index, 1);
            }
          }

          localStorage[k] = JSON.stringify(all[k]);
          break;
        case 'shortcut-key-toggle-enabled':
          localStorage[k] = v;
          break;
        case 'enabled-extension':
        case 'enabled-background-open':
        case 'enabled-multiclick-close':
        case 'disabled-same-domain':
          localStorage[k] = v ? 1 : 0;
          break;
      }
    });

    if (callback) {
      callback();
    }

    _this.notifyAllTabs();
  });
};

LinkBlanker.prototype.preferenceValueFromId = function (id, result) {
  if ('disabled-domain' === id) {
    return result.domain;
  } else if ('disabled-directory' === id) {
    return result.directory;
  } else {
    return result.url;
  }
};

LinkBlanker.prototype.updateStatus = function (tab) {
  var enabled = this.enableFromUrl(tab.url);
  var data = this.getData();

  this.chrome.tabs.sendMessage(tab.id, {
    name: 'updateStatus',
    parse: this.parseData(tab.url),
    enabled: enabled,
    isBackground: 1 === data['enabled-background-open'] && 1 === data['enabled-extension'] ? 1 : 0,
    multiClickClose: data['enabled-multiclick-close'],
    shortcutKeyTobbleEnabled: data['shortcut-key-toggle-enabled'],
    disabledSameDomain: data['disabled-same-domain']
  });

  this.chrome.browserAction.setBadgeBackgroundColor({
    color: enabled ? [48,201,221,128] : [0,0,0,64],
    tabId: tab.id
  });

  this.chrome.browserAction.setBadgeText({
    text: enabled ? ' ON ' : 'OFF',
    tabId: tab.id
  });

  this.chrome.browserAction.setIcon({
    path: 'img/icon32' + (enabled ? '' : '-disabled') + '.png',
    tabId: tab.id
  });
};

LinkBlanker.prototype.currentEnable = function (callback) {
  if (callback) {
    _this.currentData(function (result) {
      callback(_this.enableFromFullData(result));
    });
  }
};

LinkBlanker.prototype.enableFromFullData = function (info) {
  var data = this.getData();

  if (info.url.match(/^chrome:\/\/(.*)$/)) {
    return 0;
  }

  var result =
     1 === data['enabled-extension'] &&
    -1 === data['disabled-domain'].indexOf(info.domain) &&
    -1 === data['disabled-page'].indexOf(info.url);

  if (result) {
    for (var i = 0; i < data['disabled-directory'].length; i++) {
      if (info.url.match(new RegExp('^' + data['disabled-directory'][i] + '.*$'))) {
        result = false;
        break;
      }
    }
  }

  return result ? 1 : 0;
};

LinkBlanker.prototype.enableFromUrl = function (url) {
  return this.enableFromFullData(this.parseData(url));
};

LinkBlanker.prototype.currentData = function (callback) {
  if (callback) {
    _this.chrome.windows.getLastFocused(function (win) {
      if (win) {
        _this.chrome.tabs.query({windowId: win.id, active: true}, function (tabs) {
          if (tabs && tabs.length > 0) {
            _this.parseData(tabs[0].url, callback);
          }
        });
      }
    });
  }
};

LinkBlanker.prototype.parseData = function (url, callback) {
  var result = {
    domain: '',
    directory: '',
    url: url
  };

  var tmpUrl = encodeURI(url);

  var sp = tmpUrl.split('/');

  if (sp) {
    if (sp.length > 2) {
      result.domain = sp[2];
    }

    if (sp.length > 4) {
      sp.splice(sp.length - 1, 1);
    }

    result.directory = sp.join('/');
  }

  if (callback) {
    callback(result);
  }

  return result;
};

LinkBlanker.prototype.notifyAllTabs = function () {
  _this.chrome.windows.getAll({populate: true}, function (windows) {
    if (windows) {
      windows.forEach(function (win) {
        if (win.tabs) {
          win.tabs.forEach(function (tab) {
            _this.updateStatus(tab);
          });
        }
      });
    }
  });
};

LinkBlanker.prototype.deleteTabLog = function (tabId) {
  if ('undefined' === typeof tabId) {
    _this.chrome.windows.getLastFocused(function (win) {
      if (win) {
        _this.chrome.tabs.query({windowId: win.id, active: true}, function (tabs) {
          if (tabs && tabs.length > 0) {
            _this.deleteTabLog(tabs[0].id);
          }
        });
      }
    });
    return;
  }

  if (_this.tabLogs[tabId]) {
    delete _this.tabLogs[tabId];
  }
};

LinkBlanker.prototype.getTabLogs = function (key, tab, callback) {
  if ('function' === typeof tab) {
    callback = tab;
    tab = undefined;
  }

  if ('undefined' === typeof callback) {
    return;
  }

  if ('undefined' === typeof tab) {
    _this.chrome.windows.getLastFocused(function (win) {
      if (win) {
        _this.chrome.tabs.query({windowId: win.id, active: true}, function (tabs) {
          if (tabs && tabs.length > 0) {
            _this.getTabLogs(key, tabs[0], callback);
          }
        });
      }
    });
    return;
  }

  if ('object' !== typeof tab) {
    _this.chrome.tabs.get(tab, function (tab) {
      _this.getTabLogs(key, tab, callback);
    });
    return;
  }

  if (_this.tabLogs[tab.id] && _this.tabLogs[tab.id][key]) {
    callback(_this.tabLogs[tab.id][key], tab);
  } else {
    callback(false);
  }
};

LinkBlanker.prototype.setTabLogs = function (key, value, tabId) {
  if ('undefined' === typeof tabId) {
    _this.chrome.windows.getLastFocused(function (win) {
      if (win) {
        _this.chrome.tabs.query({windowId: win.id, active: true}, function (tabs) {
          if (tabs && tabs.length > 0) {
            _this.setTabLogs(key, value, tabs[0].id);
          }
        });
      }
    });
    return;
  }

  if (!_this.tabLogs[tabId]) {
    _this.tabLogs[tabId] = {};
  }

  _this.tabLogs[tabId][key] = value;
};

LinkBlanker.prototype.receiveMessages = {
  removeTabs: function (message) {
    _this.chrome.windows.getLastFocused({populate: true}, function (win) {
      win.tabs.sort(function (a, b) {
        if (a.index < b.index) return 'right' === message.align ? -1 : 1;
        if (a.index > b.index) return 'right' === message.align ? 1  : -1;
        return 0;
      });

      var removeTabs = [];
      var activeTabId = -1;

      for (var i = 0; i < win.tabs.length; i++) {
        if (win.tabs[i].active) {
          activeTabId = win.tabs[i].id;
          continue;
        }

        if (activeTabId > -1) {
          removeTabs.push(win.tabs[i]);
        }
      }

      if (removeTabs.length > 0) {
        _this.setTabLogs('remove', {
          align: message.align,
          tabs: removeTabs
        });

        _this.chrome.tabs.remove(removeTabs.map(function (item) {
          return item.id;
        }));

        message.name = 'norifyRemoveTabs';
        message.removeTabsLength = removeTabs.length;

        _this.chrome.tabs.sendMessage(activeTabId, message);
      }
    });
  },

  undoRemoveTabs: function () {
    _this.getTabLogs('remove', function (log, tab) {
      if (log && log.tabs) {
        _this.deleteTabLog();

        log.tabs.map(function (item, i) {
          _this.chrome.tabs.create({
            url: item.url,
            selected: false,
            index: ('right' === log.align ? tab.index + 1 + i : tab.index)
          });
        });
      }
    });
  },

  openTab: function (params) {
    if (params) {
      _this.chrome.windows.getLastFocused(function (win) {
        if (win) {
          _this.chrome.tabs.query({windowId: win.id, active: true}, function (tabs) {
            if (tabs && tabs.length > 0) {
              params.index = tabs[0].index + 1;
              _this.chrome.tabs.create(params);
            }
          });
        }
      });
    }
  },

  toggleEnabled: function () {
    _this.setData('enabled-extension', (0 === _this.getData()['enabled-extension']) ? 1 : 0);
  },
};
