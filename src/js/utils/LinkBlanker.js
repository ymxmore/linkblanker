/**
 * utils/LinkBlanker.js
 */
var async = require('async');
var LinkBlankerConstants = require('../constants/LinkBlanker');
var Logger = require('../utils/Logger');
var MessageName = LinkBlankerConstants.MessageName;

/**
 * Export the constructor.
 */
module.exports = LinkBlanker;

/**
 * LinkBlanker active instance.
 */
var _this;

/**
 * Private variables
 * No direct access!!
 */

var _hostRegExp = '';

/**
 * Constructor
 */
function LinkBlanker (chrome) {
  this.chrome = chrome;
  this.manifest = {};
  this.tabLogs = {};
  this.messageReceiveMap = {};

  initialize.apply(this);
}

function initialize () {
  _this = this;

  dataMigration();

  _this.chrome.tabs.onCreated.addListener(function(tab) {
    Logger.debug('chrome.tabs.onCreated > ', arguments);

    if (_this.hasRuntimeError()) {
      return;
    }

    _this.mergeTabInfo(tab, function (mergedTab) {
      _this.setTabLogs('info', mergedTab, mergedTab.id);
    });
  });

  _this.chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    Logger.debug('chrome.tabs.onUpdated > ', arguments);

    if (_this.hasRuntimeError()) {
      return;
    }

    _this.getTabLogs('info', tabId, function (existTab) {
      if (existTab) {
        _this.mergeTabInfo(existTab, function (mergedTab) {
          _this.setTabLogs('info', mergedTab, tabId);
        });
      } else {
        _this.deleteTabLog(tabId);
      }
    });

    _this.updateTabStatus(tab);
  });

  _this.chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    Logger.debug('chrome.tabs.onRemoved > ', arguments);

    if (_this.hasRuntimeError()) {
      return;
    }

    _this.deleteTabLog(tabId);
  });

  _this.chrome.tabs.onAttached.addListener(_this.setAllTabInfo);
  _this.chrome.tabs.onDetached.addListener(_this.setAllTabInfo);
  _this.chrome.tabs.onMoved.addListener(_this.setAllTabInfo);

  _this.chrome.extension.onConnect.addListener(function(port) {
    if (_this.hasRuntimeError()) {
      return;
    }

    var name;

    switch (port.name) {
      case MessageName.OPEN_TAB:
        name = 'openTab';
        break;
      case MessageName.REMOVE_TABS:
        name = 'removeTabs';
        break;
      case MessageName.UNDO_REMOVE_TABS:
        name = 'undoRemoveTabs';
        break;
      case MessageName.TOGGLE_ENABLED:
        name = 'toggleEnabled';
        break;
    }

    if (name) {
      port.onMessage.addListener(_this.receiveMessages[name]);
    }
  });

  _this.setAllTabInfo();
  _this.updateTabStatusAll();

  return true;
}

function dataMigration () {
  // 反転する
  if ('disabled-extension' in localStorage) {
    var value = Number(localStorage['disabled-extension'] || '0');
    localStorage['enabled-extension'] = (0 === value) ? 1 : 0;
    delete localStorage['disabled-extension'];
  }
}

function getHostRegExp () {
  if (!_hostRegExp) {
    _hostRegExp = new RegExp(_this.chrome.extension.getURL('/').replace(/([.*+?^=!:${}()|\[\]\/\\])/, "\\$&"));
  }

  return _hostRegExp;
}

LinkBlanker.prototype.getAllTabs = function (callback) {
  async.waterfall([
    function(cbw) {
      _this.chrome.windows.getAll({ populate: true, windowTypes: [ 'normal' ] }, function (windows) {
        cbw(_this.hasRuntimeError(), windows);
      });
    },
    function(windows, cbw) {
      async.concat(windows, function (win, cbc) {
        if (win.tabs) {
          cbc(null, win.tabs);
        } else {
          cbc(new Error('This window does not have possession of the tab.'), null);
        }
      }, cbw);
    },
    function(tabs, cbw) {
      async.map(tabs, function (tab, cbm) {
        _this.chrome.tabs.get(tab.id, function (tab) {
          if (_this.hasRuntimeError()) {
            cbm(null, null);
            return;
          }
          cbm(null, tab);
        });
      }, cbw);
    },
    function(tabs, cbw) {
      async.filter(tabs, function (tab, cbf) {
        cbf(null !== tab);
      }, function (results) {
        cbw(null, results);
      });
    },
  ], callback);
};

LinkBlanker.prototype.getCurrentTab = function (callback) {
  if (callback) {
    async.waterfall([
      function(cbw) {
        _this.chrome.windows.getLastFocused(function (win) {
          cbw(_this.hasRuntimeError(), win);
        });
      },
      function(win, cbw) {
        _this.chrome.tabs.query({ windowId: win.id, active: true }, function (tabs) {
          cbw(_this.hasRuntimeError(), tabs);
        });
      },
      function(tabs, cbw) {
        if (tabs && tabs.length > 0) {
          cbw(null, tabs[0]);
        } else {
          cbw(new Error('Target tab is none.'), null);
        }
      },
    ], callback);
  } else {
    Logger.debug(new Error('Callback is undefined.'));
  }
};

LinkBlanker.prototype.hasRuntimeError = function () {
  var error = _this.chrome.runtime.lastError;

  if (error) {
    Logger.debug(error.message, error);
  }

  return error;
};

LinkBlanker.prototype.getManifest = function () {
  return _this.chrome.runtime.getManifest();
};

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

LinkBlanker.prototype.setData = function (key, value) {
  var all  = _this.getData();
  var data = {};

  if ('object' === typeof key) {
    data = key;
  } else if ('function' !== typeof value) {
    data[key] = value;
  }

  _this.getCurrentData(function(error, result) {
    if (error) {
      return;
    }

    Object.keys(data).forEach(function (fixKey) {
      var fixValue = data[fixKey];

      switch (fixKey) {
        case 'disabled-domain':
        case 'disabled-directory':
        case 'disabled-page':
          var item  = _this.preferenceValueFromId(fixKey, result);
          var index = all[fixKey].indexOf(item);

          if (fixValue) {
            if (-1 === index) {
              all[fixKey].push(item);
            }
          } else {
            if (index > -1) {
              all[fixKey].splice(index, 1);
            }
          }

          localStorage[fixKey] = JSON.stringify(all[fixKey]);
          break;
        case 'shortcut-key-toggle-enabled':
          localStorage[fixKey] = fixValue;
          break;
        case 'enabled-extension':
        case 'enabled-background-open':
        case 'enabled-multiclick-close':
        case 'disabled-same-domain':
          localStorage[fixKey] = fixValue ? 1 : 0;
          break;
      }
    });

    _this.chrome.extension.sendMessage({
      name: MessageName.UPDATED_DATA,
      data: _this.getData(),
    });

    _this.updateTabStatusAll();
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

LinkBlanker.prototype.updateTabStatus = function (tab) {
  var enabled = _this.isEnableFromUrl(tab.url);
  var data = _this.getData();

  _this.chrome.tabs.get(tab.id, function (tab) {
    if (_this.hasRuntimeError()) {
      return;
    }

    _this.chrome.tabs.sendMessage(tab.id, {
      name: MessageName.UPDATE_TAB_STATUS,
      parse: _this.parseData(tab.url),
      enabled: enabled,
      isBackground: 1 === data['enabled-background-open'] && 1 === data['enabled-extension'] ? 1 : 0,
      multiClickClose: data['enabled-multiclick-close'],
      shortcutKeyTobbleEnabled: data['shortcut-key-toggle-enabled'],
      disabledSameDomain: data['disabled-same-domain']
    });

    _this.chrome.browserAction.setBadgeBackgroundColor({
      color: enabled ? [48,　201,　221,　128] : [0,　0,　0,　64],
      tabId: tab.id
    });

    _this.chrome.browserAction.setBadgeText({
      text: enabled ? ' ON ' : 'OFF',
      tabId: tab.id
    });

    _this.chrome.browserAction.setIcon({
      path: 'img/icon32' + (enabled ? '' : '-disabled') + '.png',
      tabId: tab.id
    });
  });
};

LinkBlanker.prototype.updateTabStatusAll = function () {
  _this.getAllTabs(function (error, tabs) {
    if (error) {
      Logger.debug('The failure to update the status of all the tabs.', error);
    } else {
      async.each(tabs, function (tab, cbe) {
        _this.updateTabStatus(tab);
        cbe();
      });
    }
  });
};

LinkBlanker.prototype.isEnableFromData = function (info) {
  var data = this.getData();

  if (!info.url.match(getHostRegExp()) && info.url.match(/^chrome(-extension)?:\/\/(.*)$/)) {
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

LinkBlanker.prototype.isEnableFromUrl = function (url) {
  return this.isEnableFromData(this.parseData(url));
};

LinkBlanker.prototype.getCurrentData = function (callback) {
  if (callback) {
    _this.getCurrentTab(function (error, tab) {
      if (error) {
        callback(error, null);
        return;
      }

      _this.parseData(tab.url, function (result) {
        callback(null, result);
      });
    });
  } else {
    Logger.debug(new Error('Callback is undefined.'));
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

LinkBlanker.prototype.setAllTabInfo = function () {
  _this.getAllTabs(function (error, tabs) {
    if (error) {
      Logger.debug('It is not possible to set all of the tab information.', error);
    } else {
      async.each(tabs, function (tab, cbe) {
        _this.mergeTabInfo(tab, function (mergedTab) {
          _this.setTabLogs('info', mergedTab, mergedTab.id);
          cbe();
        });
      });
    }
  });
};

LinkBlanker.prototype.mergeTabInfo = function (tab, callback) {
  _this.getTabLogs('info', tab.id, function (existTab) {
    var filterdTab = _this.filterTabPropaties(tab);

    if (existTab) {
      Object.keys(filterdTab).forEach(function (key) {
        existTab[key] = filterdTab[key];
      });

      callback(existTab);
    } else {
      callback(filterdTab);
    }
  });
};

LinkBlanker.prototype.filterTabPropaties = function (tab) {
  var propaties = [
    'id',
    'favIconUrl',
    'index',
    'title',
    'url',
    'windowId',
  ];

  var len = propaties.length;
  var result = {};

  for (var i = 0; i < len; i++) {
    var key = propaties[i];

    if (key in tab) {
      result[key] = tab[key];
    }
  }

  return result;
};

LinkBlanker.prototype.getTabLogs = function (key, tabId, callback) {
  var fixKey, fixTabId, fixCallback;

  if (key) {
    if (String(key).match(/^[0-9]+$/)) {
      fixTabId = Number(key);
      fixKey = '*';
    } else {
      fixKey = key;
    }
  }

  if ('function' === typeof tabId) {
    fixCallback = tabId;
  } else if ('object' === typeof tabId && 'id' in tabId && String(tabId.id).match(/^[0-9]+$/)) {
    fixTabId = Number(tabId.id);
  } else if (String(tabId).match(/^[0-9]+$/)) {
    fixTabId = Number(tabId);
  }

  if ('function' === typeof callback) {
    fixCallback = callback;
  }

  if ('undefined' === typeof callback && !fixCallback) {
    return;
  }

  if (!fixTabId) {
    _this.getCurrentTab(function (error, tab) {
      if (error) {
        callback(error, null);
        return;
      }

      _this.getTabLogs(fixKey, tab, fixCallback);
    });
    return;
  }

  _this.chrome.tabs.get(fixTabId, function (tab) {
    if (_this.hasRuntimeError()) {
      fixCallback(false);
    }

    if (fixTabId in _this.tabLogs) {
      if (fixKey && '*' !== fixKey && fixKey in _this.tabLogs[fixTabId]) {
        fixCallback(_this.tabLogs[fixTabId][fixKey], tab);
      } else {
        fixCallback(_this.tabLogs[fixTabId], tab);
      }
    } else {
      fixCallback(false);
    }
  });
};

LinkBlanker.prototype.setTabLogs = function (key, value, tabId) {
  if ('undefined' === typeof tabId) {
    _this.getCurrentTab(function (error, tab) {
      if (error) {
        callback(error, null);
        return;
      }

      _this.setTabLogs(key, value, tab.id);
    });
    return;
  }

  if (!(tabId in _this.tabLogs)) {
    _this.tabLogs[tabId] = {};
  }

  _this.tabLogs[tabId][key] = value;

  _this.chrome.extension.sendMessage({
    name: MessageName.SAVED_TAB_LOG,
    data: _this.tabLogs,
  });

  Logger.debug(MessageName.SAVED_TAB_LOG, _this.tabLogs);
};

LinkBlanker.prototype.deleteTabLog = function (key, tabId) {
  if (key && !tabId && String(key).match(/^[0-9]+$/)) {
    tabId = Number(key);
    key = '*';
  }

  if ('undefined' === typeof tabId) {
    _this.getCurrentTab(function (error, tab) {
      if (error) {
        callback(error, null);
        return;
      }

      _this.deleteTabLog(key, tab.id);
    });
    return;
  }

  if (tabId in _this.tabLogs) {
    if (key && '*' !== key) {
      delete _this.tabLogs[tabId][key];
    } else {
      delete _this.tabLogs[tabId];
    }
  }

  _this.chrome.extension.sendMessage({
    name: MessageName.DELETED_TAB_LOG,
    data: _this.tabLogs
  });

  Logger.debug(MessageName.DELETED_TAB_LOG, _this.tabLogs);
};

LinkBlanker.prototype.receiveMessages = {

  openTab: function (params) {
    if (params) {
      _this.getCurrentTab(function (error, tab) {
        if (error) {
          callback(error, null);
          return;
        }

        _this.chrome.tabs.create({
          index: 'index' in params ? params.index : tab.index + 1,
          url: params.url,
          selected: params.selected,
        }, function (newTab) {
          var filterdTab = _this.filterTabPropaties(newTab);
          filterdTab.openerTabId = tab.id;
          _this.setTabLogs('info', filterdTab, filterdTab.id);
        });
      });
    }
  },

  removeTabs: function (message) {
    _this.chrome.windows.getLastFocused({ populate: true, windowTypes: [ 'normal' ] }, function (win) {
      if (_this.hasRuntimeError()) {
        return;
      }

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
          removeTabs.push(_this.filterTabPropaties(win.tabs[i]));
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

        message.name = MessageName.REMOVE_TABS;
        message.removeTabsLength = removeTabs.length;

        _this.chrome.tabs.sendMessage(activeTabId, message);
      }
    });
  },

  undoRemoveTabs: function () {
    _this.getTabLogs('remove', function (log, tab) {
      if (log && log.tabs) {
        log.tabs.map(function (item, i) {
          _this.receiveMessages.openTab({
            url: item.url,
            selected: false,
            index: ('right' === log.align ? tab.index + 1 + i : tab.index)
          });
        });

        _this.deleteTabLog('remove', tab.id);
      }
    });
  },

  toggleEnabled: function () {
    _this.setData('enabled-extension', (0 === _this.getData()['enabled-extension']) ? 1 : 0);
  },
};