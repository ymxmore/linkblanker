/**
 * Export the constructor.
 */
module.exports = LinkBlanker;

function LinkBlanker (chrome) {
  this.chrome = chrome;
  this.manifest = {};

  initialize.apply(this);
}

function initialize () {
  var self = this;

  self.chrome.tabs.getAllInWindow(null, function(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      self.updateStatus(tabs[i], 1);
    }
  });

  self.chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    self.updateStatus(tab);
  });

  self.chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(self.reciveMessages[port.name]);
  });

  loadManifest.apply(self);
}

function loadManifest () {
  var self = this;

  var url = self.chrome.extension.getURL('/manifest.json'),
    xhr = new XMLHttpRequest();

  xhr.onload = function(){
    self.manifest = JSON.parse(xhr.responseText);
  };

  xhr.open('GET', url, true);
  xhr.send(null);
}

LinkBlanker.prototype.getData = function () {
  return {
    'disabled-extension': Number(localStorage['disabled-extension'] || '0'),
    'disabled-domain': JSON.parse(localStorage['disabled-domain'] || '[]'),
    'disabled-directory': JSON.parse(localStorage['disabled-directory'] || '[]'),
    'disabled-page': JSON.parse(localStorage['disabled-page'] || '[]'),
    'enabled-background-open': Number(localStorage['enabled-background-open'] || '0'),
    'enabled-multiclick-close': Number(localStorage['enabled-multiclick-close'] || '0'),
    'shortcut-key-toggle-enabled': localStorage['shortcut-key-toggle-enabled'] || '',
  };
};

LinkBlanker.prototype.setData = function (key, value) {
  var self = this;
  var all  = self.getData();
  var data = {};

  if ('object' === typeof key) {
    data = key;
  } else {
    data[key] = value;
  }

  self.currentData(function(result) {
    Object.keys(data).forEach(function (k) {
      var v = data[k];

      switch (k) {
        case 'disabled-domain':
        case 'disabled-directory':
        case 'disabled-page':
            var item  = self.preferenceValueFromId(k, result);
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
        case 'disabled-extension':
        case 'enabled-background-open':
        case 'enabled-multiclick-close':
          localStorage[k] = v ? 1 : 0;
          break;
      }
    });

    self.notifyAllTabs();
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
      isBackground: 1 === data['enabled-background-open'] && 0 === data['disabled-extension'] ? 1 : 0,
      multiClickClose: 1 === data['enabled-multiclick-close'] && 0 === data['disabled-extension'] ? 1 : 0,
      shortcutKeyTobbleEnabled: data['shortcut-key-toggle-enabled']
    });
  }

  this.chrome.browserAction.setBadgeBackgroundColor({
    color: enable ? [0,0,200,128] : [200,0,0,128],
    tabId: tab.id
  });

  this.chrome.browserAction.setBadgeText({
    text: enable ? 'RUN' : 'STOP',
    tabId: tab.id
  });
};

LinkBlanker.prototype.currentEnable = function (callback) {
  var self = this;

  if (callback) {
    self.currentData(function (result) {
      callback(self.enableFromFullData(result));
    });
  }
};

LinkBlanker.prototype.enableFromFullData = function (info) {
  var data = this.getData();

  if (info.url.match(/^chrome:\/\/(.*)$/)) {
    return 0;
  }

  var result =
     0 === data['disabled-extension'] &&
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
  var self = this;

  if (callback) {
    self.chrome.tabs.getSelected(null, function (tab) {
      self.parseData(tab.url, callback);
    });
  }
};

LinkBlanker.prototype.parseData = function (url, callback) {
  url = encodeURI(url);

  var result = {
    domain: '',
    directory: '',
    url: url
  };

  var sp = result.url.split('/');

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
  var self = this;

  self.chrome.tabs.getAllInWindow(null, function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
      self.updateStatus(tabs[i]);
    }
  });
};

LinkBlanker.prototype.reciveMessages = {
  removeTabs: function (message) {
    var self = this;

    self.chrome.tabs.getAllInWindow(null, function (tabs) {
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
        self.chrome.tabs.remove(removeTabs);

        message.name = 'norifyRemoveTabs';
        message.removeTabsLength = removeTabs.length;

        self.chrome.tabs.sendMessage(activeTabId, message);
      }
    });
  },

  openTab: function (params) {
    var self = this;

    if (params) {
      self.chrome.tabs.getSelected(null, function (tab) {
        params.index = tab.index + 1;
        self.chrome.tabs.create(params);
      });
    }
  },

  toggleEnabled: function () {
    this.setData('disabled-extension', (0 === this.getData()['disabled-extension']) ? 1 : 0);
  }
};
