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

  initialize.apply(this);
}

function initialize () {
  _this = this;

  _this.chrome.tabs.getAllInWindow(null, function(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      _this.updateStatus(tabs[i], 1);
    }
  });

  _this.chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    _this.updateStatus(tab);
  });

  _this.chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(_this.reciveMessages[port.name]);
  });

  dataMigration();

  loadManifest.apply(self);
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
    'enabled-extension': Number(localStorage['enabled-extension'] || '0'),
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

LinkBlanker.prototype.updateStatus = function (tab, reload) {
  reload = reload || 0;

  var enable = this.enableFromUrl(tab.url);
  var data = this.getData();

  if (!reload) {
    this.chrome.tabs.sendMessage(tab.id, {
      name: 'updateStatus',
      enable: enable,
      isBackground: 1 === data['enabled-background-open'] && 1 === data['enabled-extension'] ? 1 : 0,
      multiClickClose: 1 === data['enabled-multiclick-close'] && 1 === data['enabled-extension'] ? 1 : 0,
      shortcutKeyTobbleEnabled: data['shortcut-key-toggle-enabled']
    });
  }

  this.chrome.browserAction.setBadgeBackgroundColor({
    color: enable ? [48,201,221,128] : [0,0,0,64],
    tabId: tab.id
  });

  this.chrome.browserAction.setBadgeText({
    text: enable ? ' ON ' : 'OFF',
    tabId: tab.id
  });

  this.chrome.browserAction.setIcon({
    path: 'dest/images/icon32' + (enable ? '' : '-disabled') + '.png',
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
    _this.chrome.tabs.getSelected(null, function (tab) {
      _this.parseData(tab.url, callback);
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
  _this.chrome.tabs.getAllInWindow(null, function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
      _this.updateStatus(tabs[i]);
    }
  });
};

LinkBlanker.prototype.reciveMessages = {
  removeTabs: function (message) {
    _this.chrome.tabs.getAllInWindow(null, function (tabs) {
      tabs.sort(function (a, b) {
        if (a.index < b.index) return 'right' === message.align ? -1 : 1;
        if (a.index > b.index) return 'right' === message.align ? 1  : -1;
        return 0;
      });

      var removeTabs = [],
        activeTabId = -1;

      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].active) {
          activeTabId = tabs[i].id;
          continue;
        }

        if (activeTabId > -1) {
          removeTabs.push(tabs[i].id);
        }
      }

      if (removeTabs.length > 0) {
        _this.chrome.tabs.remove(removeTabs);

        message.name = 'norifyRemoveTabs';
        message.removeTabsLength = removeTabs.length;

        _this.chrome.tabs.sendMessage(activeTabId, message);
      }
    });
  },

  openTab: function (params) {
    if (params) {
      _this.chrome.tabs.getSelected(null, function (tab) {
        params.index = tab.index + 1;
        _this.chrome.tabs.create(params);
      });
    }
  },

  toggleEnabled: function () {
    _this.setData('enabled-extension', (0 === _this.getData()['enabled-extension']) ? 1 : 0);
  }
};
