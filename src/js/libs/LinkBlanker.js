/*
 * libs/LinkBlanker.js
 */

import async from 'async';
import Logger from './Logger';
import Util from './Util';

/**
 * LinkBlanker
 *
 * @class
 * @classdesc コアモジュール
 */
export default class LinkBlanker {
  /**
   * コンストラクタ
   *
   * @constructor
   * @public
   * @param {Chrome} chrome Chromeオブジェクト
   */
  constructor(chrome) {
    this.chrome = chrome;
    this.manifest = chrome.runtime.getManifest();
    this.tabLog = {};
    this.receiveMessages = {};
    this.currentWindowId = -1;
    this.init();
  }

  /**
   * 全てのデータを取得
   *
   * @public
   * @return {Object} 全てのデータ
   */
  getData() {
    return {
      'disabled-directory': JSON.parse(localStorage['disabled-directory'] || '[]'),
      'disabled-domain': JSON.parse(localStorage['disabled-domain'] || '[]'),
      'disabled-on': JSON.parse(localStorage['disabled-on'] || '0'),
      'disabled-page': JSON.parse(localStorage['disabled-page'] || '[]'),
      'disabled-same-domain': Number(localStorage['disabled-same-domain'] || '0'),
      'enabled-background-open': Number(localStorage['enabled-background-open'] || '0'),
      'enabled-extension': Number(localStorage['enabled-extension'] || '1'),
      'enabled-multiclick-close': Number(localStorage['enabled-multiclick-close'] || '0'),
      'shortcut-key-toggle-enabled': localStorage['shortcut-key-toggle-enabled'] || '',
      'visible-link-state': Number(localStorage['visible-link-state'] || '0'),
    };
  }

  /**
   * データを保存
   *
   * @public
   * @param {string} key キー
   * @param {*} value 値
   * @param {function(Error,Object)} callback 結果のコールバック関数
   */
  setData(key, value, callback) {
    const all = this.getData();
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
          const v = data[k];

          switch (k) {
            case 'disabled-domain':
            case 'disabled-directory':
            case 'disabled-page': {
              const item = this.preferenceValueFromId(k, result);
              const index = all[k].indexOf(item);

              if (v) {
                if (index === -1) {
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

  /**
   * 全てののタブを返却
   *
   * @public
   * @param {function(Error,Object)} callback 結果のコールバック関数
   */
  getAllTabs(callback) {
    async.waterfall([
      (cbw) => {
        this.chrome.windows.getAll({populate: true, windowTypes: ['normal']}, (windows) => {
          cbw(this.getRuntimeError(), windows);
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
            if (this.getRuntimeError()) {
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
      },
    ], callback);
  }

  /**
   * 初期化処理
   *
   * @private
   */
  init() {
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

  /**
   * データのマイグレーション
   *
   * @private
   */
  dataMigration() {
    // 反転する
    if ('disabled-extension' in localStorage) {
      const value = Number(localStorage['disabled-extension'] || '0');
      localStorage['enabled-extension'] = (0 === value) ? 1 : 0;
      delete localStorage['disabled-extension'];
    }
  }

  /**
   * 現在のタブを返却
   *
   * @private
   * @param {function(Error,Object)} callback 結果のコールバック関数
   */
  getCurrentTab(callback) {
    if (!callback) {
      Logger.error(new Error('Callback is undefined.'));
      return;
    }

    async.waterfall([
      (cbw) => {
        if (this.currentWindowId > -1) {
          cbw(null, this.currentWindowId);
        } else {
          this.chrome.windows.getCurrent({populate: true, windowTypes: ['normal']}, (win) => {
            this.currentWindowId = win.id;
            cbw(this.getRuntimeError(), win.id);
          });
        }
      },
      (windowId, cbw) => {
        this.chrome.tabs.query({windowId: windowId, active: true}, (tabs) => {
          cbw(this.getRuntimeError(), tabs);
        });
      },
      (tabs, cbw) => {
        if (tabs && tabs.length > 0) {
          cbw(null, tabs[0]);
        } else {
          cbw(new Error('Target tab is none.'), null);
        }
      },
    ], callback);
  }

  /**
   * ランタイムエラーを返却
   *
   * @private
   * @param {string} id タブオブジェクト
   * @param {Object} result 結果オブジェクト
   * @return {string} 結果
   */
  getRuntimeError() {
    const error = this.chrome.runtime.lastError;

    if (error) {
      Logger.error(error.message, error);
    }

    return error;
  }

  /**
   * 対象のキーを元に結果オブジェクトから適切な値を返却
   *
   * @private
   * @param {string} id タブオブジェクト
   * @param {Object} result 結果オブジェクト
   * @return {string} 結果
   */
  preferenceValueFromId(id, result) {
    if (id === 'disabled-domain') {
      return result.domain;
    } else if (id === 'disabled-directory') {
      return result.directory;
    } else {
      return result.url;
    }
  }

  /**
   * タブの状態を更新
   *
   * @private
   * @param {Object} tab タブオブジェクト
   */
  updateTabStatus(tab) {
    const enabled = this.isEnableFromUrl(tab.url);
    const data = this.getData();

    this.chrome.tabs.get(tab.id, (tab) => {
      if (this.getRuntimeError()) {
        return;
      }

      this.chrome.tabs.sendMessage(tab.id, {
        name: 'updateTabStatus',
        parsed: Util.parseUrl(tab.url),
        enabled: enabled,
        isBackground: data['enabled-background-open'],
        multiClickClose: data['enabled-extension'] === 1
          && data['enabled-multiclick-close'] == 1 ? 1 : 0,
        shortcutKeyTobbleEnabled: data['shortcut-key-toggle-enabled'],
        disabledSameDomain: data['disabled-same-domain'],
        isVisibleLinkState: data['enabled-extension'] === 1
          && data['visible-link-state'] == 1 ? 1 : 0,
      });

      this.chrome.browserAction.setBadgeBackgroundColor({
        color: enabled ? [48, 201, 221, 128] : [0, 0, 0, 64],
        tabId: tab.id,
      });

      this.chrome.browserAction.setBadgeText({
        text: enabled ? ' ON ' : 'OFF',
        tabId: tab.id,
      });

      this.chrome.browserAction.setIcon({
        path: 'img/icon32' + (enabled ? '' : '-disabled') + '.png',
        tabId: tab.id,
      });
    });
  }

  /**
   * 指定されたURLデータは当拡張機能の制御が有効かどうかを返却
   *
   * @private
   * @param {Object} info URLデータ
   * @return {number} 1: 有効, 0: 無効
   */
  isEnableFromData(info) {
    const data = this.getData();

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

  /**
   * 指定されたURLは当拡張機能の制御が有効かどうかを返却
   *
   * @private
   * @param {string} url URL
   * @return {number} 1: 有効, 0: 無効
   */
  isEnableFromUrl(url) {
    return this.isEnableFromData(Util.parseUrl(url));
  }

  /**
   * 現在のタブのURLデータを返却
   *
   * @private
   * @param {Function} callback コールバック関数
   */
  getCurrentData(callback) {
    if (!callback) {
      return;
    }

    this.getCurrentTab((error, tab) => {
      if (error) {
        callback(error, null);
        return;
      }

      callback(null, Util.parseUrl(tab.url));
    });
  }

  /**
   * 全てのタブの状態を更新
   *
   * @private
   */
  updateTabStatusAll() {
    this.getAllTabs((error, tabs) => {
      async.each(tabs, (tab, cbe) => {
        this.updateTabStatus(tab);
        cbe();
      });
    });
  }

  /**
   * タブに関するログを削除
   *
   *
   * @private
   * @param {number} tabId タブID
   */
  deleteTabLog(tabId) {
    if (typeof tabId === 'undefined') {
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

  /**
   * タブに関するログを取得
   *
   * @private
   * @param {string} key キー
   * @param {Object} [tab=null] タブオブジェクト
   * @param {Function} [callback=null] コールバック関数
   */
  getTabLog(key, tab = null, callback = null) {
    if (typeof tab === 'function') {
      callback = tab;
      tab = null;
    }

    if (callback === null) {
      return;
    }

    if (tab === null) {
      this.getCurrentTab((error, tab) => {
        if (error && callback) {
          callback(error, null);
          return;
        }

        this.getTabLog(key, tab, callback);
      });
      return;
    }

    if (typeof tab !== 'object') {
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

  /**
   * タブに関するログを記録
   *
   * @private
   * @param {string} key キー
   * @param {Object} value 値
   * @param {number} tabId タブID
   */
  setTabLog(key, value, tabId) {
    if (typeof tabId === 'undefined') {
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

  /**
   * タブ削除のイベントハンドラ
   *
   * @private
   * @param {Object} message パラメータ
   */
  onRemoveTabs(message) {
    this.chrome.windows.getCurrent({
      populate: true,
      windowTypes: ['normal'],
    }, (win) => {
      win.tabs.sort((a, b) => {
        if (a.index < b.index) {
          return message.align === 'right' ? -1 : 1;
        }

        if (a.index > b.index) {
          return message.align === 'right' ? 1 : -1;
        }

        return 0;
      });

      const removeTabs = [];
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
          tabs: removeTabs,
        });

        this.chrome.tabs.remove(removeTabs.map((item) => {
          return item.id;
        }));

        message.name = 'norifyRemoveTabs';
        message.removeTabsLength = removeTabs.length;

        this.chrome.tabs.sendMessage(activeTabId, message);
      }
    });
  }

  /**
   * タブを元に戻すイベントハンドラ
   *
   * @private
   */
  onUndoRemoveTabs() {
    this.getTabLog('remove', (log, tab) => {
      if (log && log.tabs) {
        this.deleteTabLog();

        log.tabs.map((item, i) => {
          this.chrome.tabs.create({
            url: item.url,
            selected: false,
            index: (log.align === 'right'
              ? tab.index + 1 + i
              : tab.index),
          });
        });
      }
    });
  }

  /**
   * タブオープンのイベントハンドラ
   *
   * @private
   * @param {Object} param パラメータ
   */
  onOpenTab(param) {
    if (param) {
      this.getCurrentTab((error, tab) => {
        if (error) {
          Logger.error(error);
          return;
        }

        param.index = tab.index + 1;
        this.chrome.tabs.create(param);
      });
    }
  }

  /**
   * 有効状態変更のイベントハンドラ
   *
   * @private
   */
  onToggleEnabled() {
    this.setData(
      'enabled-extension',
      (this.getData()['enabled-extension'] === 0) ? 1 : 0
    );
  }

  /**
   * 受信メッセージイベントハンドラをセット
   *
   * @private
   */
  setReceiveMessages() {
    this.receiveMessages = Util.bindAll({
      removeTabs: this.onRemoveTabs,
      undoRemoveTabs: this.onUndoRemoveTabs,
      openTab: this.onOpenTab,
      toggleEnabled: this.onToggleEnabled,
    }, this);
  }
}
