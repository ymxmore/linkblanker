/*
 * libs/LinkBlanker.js
 */

import async from 'async';
import Logger from './Logger';
import Util from './Util';

export default class LinkBlanker {

  constructor(chrome) {
    this.chrome = chrome;
    this.manifest = chrome.runtime.getManifest();
    this.tabLog = {};
    this.receiveMessages = {};
    this.currentWindowId = -1;
    this.initialize(this);
  }

  initialize() {
    this.dataMigration();

    this.chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.updateTabStatus(tab);
    });

    this.chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      this.deleteTabLog(tabId);
    });

    this.chrome.windows.onFocusChanged.addListener((windowId) => {
      this.currentWindowId = windowId;
    });

    this.setReceiveMessages();

    this.chrome.extension.onConnect.addListener((port) => {
      port.onMessage.addListener(this.receiveMessages[port.name]);
    });

    this.updateTabStatusAll();
  }

  dataMigration() {
    // 反転する
    if ('disabled-extension' in localStorage) {
      let value = Number(localStorage['disabled-extension'] || '0');
      localStorage['enabled-extension'] = (0 === value) ? 1 : 0;
      delete localStorage['disabled-extension'];
    }
  }

  getData() {
    return {
      'enabled-extension': Number(localStorage['enabled-extension'] || '1'),
      'disabled-domain': JSON.parse(localStorage['disabled-domain'] || '[]'),
      'disabled-directory': JSON.parse(localStorage['disabled-directory'] || '[]'),
      'disabled-page': JSON.parse(localStorage['disabled-page'] || '[]'),
      'disabled-on': JSON.parse(localStorage['disabled-on'] || '0'),
      'enabled-background-open': Number(localStorage['enabled-background-open'] || '0'),
      'disabled-same-domain': Number(localStorage['disabled-same-domain'] || '0'),
      'enabled-multiclick-close': Number(localStorage['enabled-multiclick-close'] || '0'),
      'visible-link-state': Number(localStorage['visible-link-state'] || '0'),
      'shortcut-key-toggle-enabled': localStorage['shortcut-key-toggle-enabled'] || ''
    };
  }

  setData(key, value, callback) {
    let all  = this.getData();
    let data = {};

    if ('object' === typeof key) {
      data = key;
    } else if ('function' !== typeof value) {
      data[key] = value;
    }

    if (!callback && 'function' === typeof value) {
      callback = value;
    }

    this.getCurrentData((error, result) => {
      if (!error) {
        Object.keys(data).forEach((k) => {
          let v = data[k];

          switch (k) {
            case 'disabled-domain':
            case 'disabled-directory':
            case 'disabled-page': {
              let item  = this.preferenceValueFromId(k, result);
              let index = all[k].indexOf(item);

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
            }
            case 'shortcut-key-toggle-enabled':
              localStorage[k] = v;
              break;
            case 'enabled-extension':
            case 'enabled-background-open':
            case 'enabled-multiclick-close':
            case 'disabled-same-domain':
            case 'disabled-on':
            case 'visible-link-state':
              localStorage[k] = v ? 1 : 0;
              break;
          }
        });
      }

      if (callback) {
        callback(error);
      }

      this.updateTabStatusAll();
    });
  }

  getAllTabs(callback) {
    async.waterfall([
      (cbw) => {
        this.chrome.windows.getAll({ populate: true, windowTypes: [ 'normal' ] }, (windows) => {
          cbw(this.hasRuntimeError(), windows);
        });
      },
      (windows, cbw) => {
        async.concat(windows, (win, cbc) => {
          if (win.tabs) {
            cbc(null, win.tabs);
          } else {
            cbc(new Error('This window does not have possession of the tab.'), null);
          }
        }, cbw);
      },
      (tabs, cbw) => {
        async.map(tabs, (tab, cbm) => {
          this.chrome.tabs.get(tab.id, (tab) => {
            if (this.hasRuntimeError()) {
              cbm(null, null);
              return;
            }
            cbm(null, tab);
          });
        }, cbw);
      },
      (tabs, cbw) => {
        async.filter(tabs, (tab, cbf) => {
          cbf(null, null !== tab);
        }, cbw);
      }
    ], callback);
  }

  getCurrentTab(callback) {
    if (callback) {
      async.waterfall([
        (cbw) => {
          if (this.currentWindowId > -1) {
            cbw(null, this.currentWindowId);
          } else {
            this.chrome.windows.getCurrent({ populate: true, windowTypes: [ 'normal' ] }, (win) => {
              this.currentWindowId = win.id;
              cbw(this.hasRuntimeError(), win.id);
            });
          }
        },
        (windowId, cbw) => {
          this.chrome.tabs.query({ windowId: windowId, active: true }, (tabs) => {
            cbw(this.hasRuntimeError(), tabs);
          });
        },
        (tabs, cbw) => {
          if (tabs && tabs.length > 0) {
            cbw(null, tabs[0]);
          } else {
            cbw(new Error('Target tab is none.'), null);
          }
        }
      ], callback);
    } else {
      Logger.error(new Error('Callback is undefined.'));
    }
  }

  hasRuntimeError() {
    let error = this.chrome.runtime.lastError;

    if (error) {
      Logger.error(error.message, error);
    }

    return error;
  }

  preferenceValueFromId(id, result) {
    if ('disabled-domain' === id) {
      return result.domain;
    } else if ('disabled-directory' === id) {
      return result.directory;
    } else {
      return result.url;
    }
  }

  updateTabStatus(tab) {
    let enabled = this.isEnableFromUrl(tab.url);
    let data = this.getData();

    this.chrome.tabs.get(tab.id, (tab) => {
      if (this.hasRuntimeError()) {
        return;
      }

      this.chrome.tabs.sendMessage(tab.id, {
        name: 'updateTabStatus',
        parsed: Util.parseUrl(tab.url),
        enabled: enabled,
        isBackground: data['enabled-background-open'],
        multiClickClose: data['enabled-extension'] === 1 && data['enabled-multiclick-close'] == 1 ? 1 : 0,
        shortcutKeyTobbleEnabled: data['shortcut-key-toggle-enabled'],
        disabledSameDomain: data['disabled-same-domain'],
        isVisibleLinkState: data['enabled-extension'] === 1 && data['visible-link-state'] == 1 ? 1 : 0
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
    });
  }

  isEnableFromData(info) {
    let data = this.getData();

    if (info.url.match(/^chrome:\/\/(.*)$/)) {
      return 0;
    }

    let result =
      data['enabled-extension'] === 1 &&
      data['disabled-on'] === 0 &&
      data['disabled-domain'].indexOf(info.domain) === -1 &&
      data['disabled-page'].indexOf(info.url) === -1;

    if (result) {
      for (let i = 0; i < data['disabled-directory'].length; i++) {
        if (info.url.match(new RegExp(`^${data['disabled-directory'][i]}.*$`))) {
          result = false;
          break;
        }
      }
    }

    return result ? 1 : 0;
  }

  isEnableFromUrl(url) {
    return this.isEnableFromData(Util.parseUrl(url));
  }

  getCurrentData(callback) {
    if (callback) {
      this.getCurrentTab((error, tab) => {
        if (error) {
          callback(error, null);
          return;
        }

        callback(null, Util.parseUrl(tab.url));
      });
    }
  }

  updateTabStatusAll() {
    this.getAllTabs((error, tabs) => {
      async.each(tabs, (tab, cbe) => {
        this.updateTabStatus(tab);
        cbe();
      });
    });
  }

  deleteTabLog(tabId) {
    if ('undefined' === typeof tabId) {
      this.getCurrentTab((error, tab) => {
        if (error) {
          Logger.error(error);
          return;
        }

        this.deleteTabLog(tab.id);
      });
      return;
    }

    if (this.tabLog[tabId]) {
      delete this.tabLog[tabId];
    }
  }

  getTabLog(key, tab = null, callback = null) {
    if ('function' === typeof tab) {
      callback = tab;
      tab = null;
    }

    if (null === callback) {
      return;
    }

    if (null === tab) {
      this.getCurrentTab((error, tab) => {
        if (error && callback) {
          callback(error, null);
          return;
        }

        this.getTabLog(key, tab, callback);
      });
      return;
    }

    if ('object' !== typeof tab) {
      this.chrome.tabs.get(tab, (tab) => {
        this.getTabLog(key, tab, callback);
      });
      return;
    }

    if (this.tabLog[tab.id] && this.tabLog[tab.id][key]) {
      callback(this.tabLog[tab.id][key], tab);
    } else {
      callback(false);
    }
  }

  setTabLog(key, value, tabId) {
    if ('undefined' === typeof tabId) {
      this.getCurrentTab((error, tab) => {
        if (error) {
          Logger.error(error);
          return;
        }

        this.setTabLog(key, value, tab.id);
      });
      return;
    }

    if (!this.tabLog[tabId]) {
      this.tabLog[tabId] = {};
    }

    this.tabLog[tabId][key] = value;
  }

  setReceiveMessages() {
    this.receiveMessages = {
      removeTabs: (message) => {
        this.chrome.windows.getCurrent({ populate: true, windowTypes: [ 'normal' ] }, (win) => {
          win.tabs.sort((a, b) => {
            if (a.index < b.index) return 'right' === message.align ? -1 : 1;
            if (a.index > b.index) return 'right' === message.align ? 1  : -1;
            return 0;
          });

          let removeTabs = [];
          let activeTabId = -1;

          for (let i = 0; i < win.tabs.length; i++) {
            if (win.tabs[i].active) {
              activeTabId = win.tabs[i].id;
              continue;
            }

            if (activeTabId > -1) {
              removeTabs.push(win.tabs[i]);
            }
          }

          if (removeTabs.length > 0) {
            this.setTabLog('remove', {
              align: message.align,
              tabs: removeTabs
            });

            this.chrome.tabs.remove(removeTabs.map((item) => {
              return item.id;
            }));

            message.name = 'norifyRemoveTabs';
            message.removeTabsLength = removeTabs.length;

            this.chrome.tabs.sendMessage(activeTabId, message);
          }
        });
      },

      undoRemoveTabs: () => {
        this.getTabLog('remove', (log, tab) => {
          if (log && log.tabs) {
            this.deleteTabLog();

            log.tabs.map((item, i) => {
              this.chrome.tabs.create({
                url: item.url,
                selected: false,
                index: ('right' === log.align ? tab.index + 1 + i : tab.index)
              });
            });
          }
        });
      },

      openTab: (params) => {
        if (params) {
          this.getCurrentTab((error, tab) => {
            if (error) {
              Logger.error(error);
              return;
            }

            params.index = tab.index + 1;
            this.chrome.tabs.create(params);
          });
        }
      },

      toggleEnabled: () => {
        this.setData('enabled-extension', (0 === this.getData()['enabled-extension']) ? 1 : 0);
      }
    };
  }
}
