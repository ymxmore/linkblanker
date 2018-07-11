/*
 * libs/LinkBlanker.js
 */

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
   * @return {Promise} 全てのデータ
   */
  getData() {
    return Promise.resolve({
      'disabled-directory': JSON.parse(localStorage['disabled-directory'] || '[]'),
      'disabled-domain': JSON.parse(localStorage['disabled-domain'] || '[]'),
      'disabled-on': JSON.parse(localStorage['disabled-on'] || '0'),
      'disabled-page': JSON.parse(localStorage['disabled-page'] || '[]'),
      'disabled-same-domain': Number(localStorage['disabled-same-domain'] || '0'),
      'enabled-background-open': Number(localStorage['enabled-background-open'] || '0'),
      'enabled-extension': Number(localStorage['enabled-extension'] || '1'),
      'enabled-left-click': Number(localStorage['enabled-left-click'] || '1'),
      'enabled-middle-click': Number(localStorage['enabled-middle-click'] || '0'),
      'enabled-multiclick-close': Number(localStorage['enabled-multiclick-close'] || '0'),
      'enabled-right-click': Number(localStorage['enabled-right-click'] || '0'),
      'no-close-fixed-tab': Number(localStorage['no-close-fixed-tab'] || '1'),
      'shortcut-key-toggle-enabled': localStorage['shortcut-key-toggle-enabled'] || '',
      'visible-link-state': Number(localStorage['visible-link-state'] || '0'),
    });
  }

  /**
   * データを保存
   *
   * @public
   * @param {string|object} key キー|オブジェクト
   * @param {*} value 値
   * @return {Promise} 全てのデータ
   */
  setData(key, value) {
    let params = {};

    if (typeof key === 'object') {
      params = key;
    } else {
      params[key] = value;
    }

    return Promise.all([this.getData(), this.getCurrentTabUrlData()])
      .then(([data, urlData]) => {
        Object.keys(params).forEach((k) => {
          const v = params[k];

          switch (k) {
            case 'disabled-domain':
            case 'disabled-directory':
            case 'disabled-page': {
              const item = this.urlDataValueFromKey(k, urlData);

              if (item && item !== '' && item !== null) {
                const index = data[k].indexOf(item);

                if (v) {
                  if (index === -1) {
                    data[k].push(item);
                  }
                } else {
                  if (index > -1) {
                    data[k].splice(index, 1);
                  }
                }
              }

              data[k] = data[k].filter((item) => item && item !== '' && item !== null);

              localStorage[k] = JSON.stringify(data[k]);
              break;
            }
            case 'shortcut-key-toggle-enabled':
              localStorage[k] = v;
              break;
            case 'enabled-extension':
            case 'enabled-background-open':
            case 'enabled-multiclick-close':
            case 'enabled-left-click':
            case 'enabled-middle-click':
            case 'enabled-right-click':
            case 'disabled-same-domain':
            case 'disabled-on':
            case 'visible-link-state':
            case 'no-close-fixed-tab':
              localStorage[k] = v ? 1 : 0;
              break;
          }
        });

        return this.updateAllTabStatus()
          .then(() => this.getData());
      });
  }

  /**
   * 全てのタブ情報を返却
   *
   * @public
   * @return {Promise} 全てのタブ情報
   */
  getAllTabs() {
    return this.getAllWindow()
      .then((wins) => wins.reduce((previous, win) => {
        if (win.tabs) {
          return previous.concat(win.tabs);
        }

        return previous;
      }, []))
      .then((tabs) => Promise.all(tabs.map((tab) => (new Promise((resolve) => {
        this.chrome.tabs.get(tab.id, (item) => {
          const err = this.getRuntimeError();

          if (err) {
            reject(err);
          } else if (!item) {
            reject(new Error(`Tab is none. [${tab.id}]`));
          } else {
            resolve(item);
          }
        });
      }).catch((e) => {
        Logger.warn(e);
        return null;
      })))))
      .then((tabs) => tabs.filter((tab) => tab !== null));
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

    this.chrome.tabs.onRemoved.addListener((tabId) => {
      this.deleteTabLogIfExist(tabId);
    });

    this.chrome.windows.onFocusChanged.addListener((windowId) => {
      this.currentWindowId = windowId;
    });

    this.receiveMessages = Util.bindAll({
      removeTabs: this.onRemoveTabs,
      undoRemoveTabs: this.onUndoRemoveTabs,
      openTab: this.onOpenTab,
      toggleEnabled: this.onToggleEnabled,
    }, this);

    this.chrome.extension.onConnect.addListener((port) => {
      port.onMessage.addListener(this.receiveMessages[port.name]);
    });

    this.updateAllTabStatus();
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
   * 全てのウィンドウ情報を返却
   *
   * @return {Promise} 現在のウィンドウ情報
   */
  getAllWindow() {
    return new Promise((resolve, reject) => {
      this.chrome.windows.getAll({populate: true, windowTypes: ['normal']}, (wins) => {
        const err = this.getRuntimeError();

        if (err) {
          reject(err);
        } else {
          resolve(wins);
        }
      });
    });
  }

  /**
   * 現在のウィンドウ情報を返却
   *
   * @return {Promise} 現在のウィンドウ情報
   */
  getCurrentWindow() {
    return new Promise((resolve, reject) => {
      if (this.currentWindowId > -1) {
        this.chrome.windows.get(this.currentWindowId, {populate: true, windowTypes: ['normal']}, (win) => {
          const err = this.getRuntimeError();

          if (err) {
            reject(err);
          } else {
            resolve(win);
          }
        });
      } else {
        this.chrome.windows.getCurrent({populate: true, windowTypes: ['normal']}, (win) => {
          const err = this.getRuntimeError();

          if (err) {
            reject(err);
          } else if (!win) {
            reject(new Error('Current window is none.'));
          } else {
            this.currentWindowId = win.id;
            resolve(win);
          }
        });
      }
    });
  }

  /**
   * 現在のタブ情報を返却
   *
   * @private
   * @return {Promise} 現在のタブ情報
   */
  getCurrentTab() {
    return this.getCurrentWindow()
      .then((win) => new Promise((resolve, reject) => {
        this.chrome.tabs.query({windowId: win.id, active: true}, (tabs) => {
          const err = this.getRuntimeError();

          if (err) {
            reject(err);
          } else if (!tabs || tabs.length <= 0) {
            reject(new Error('Current tab is none.'));
          } else {
            resolve(tabs[0]);
          }
        });
      }));
  }

  /**
   * 現在のタブのURLデータを返却
   *
   * @private
   * @return {Promise} 現在のタブのURLデータ
   */
  getCurrentTabUrlData() {
    return this.getCurrentTab()
      .then((tab) => Util.parseUrl(tab.url));
  }

  /**
   * タブの状態を更新
   *
   * @private
   * @param {object} tab タブオブジェクト
   * @return {Promise} 結果
   */
  updateTabStatus(tab) {
    return Promise.all([this.isEnableFromUrl(tab.url), this.getData()])
      .then(([enabled, data]) => new Promise((resolve, reject) => {
        this.chrome.tabs.get(tab.id, (tab) => {
          this.chrome.tabs.sendMessage(tab.id, {
            name: 'updateTabStatus',
            parsed: Util.parseUrl(tab.url),
            enabled: enabled,
            isBackground: data['enabled-background-open'],
            multiClickClose: data['enabled-extension'] === 1
              && data['enabled-multiclick-close'] == 1 ? 1 : 0,
            shortcutKeyToggleEnabled: data['shortcut-key-toggle-enabled'],
            disabledSameDomain: data['disabled-same-domain'],
            isVisibleLinkState: data['enabled-extension'] === 1
              && data['visible-link-state'] == 1 ? 1 : 0,
            isLeftClick: data['enabled-extension'] === 1
              && data['enabled-left-click'] == 1 ? 1 : 0,
            isMiddleClick: data['enabled-extension'] === 1
              && data['enabled-middle-click'] == 1 ? 1 : 0,
            isRightClick: data['enabled-extension'] === 1
              && data['enabled-right-click'] == 1 ? 1 : 0,
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

          resolve();
        });
      }));
  }

  /**
   * 全てのタブの状態を更新
   *
   * @private
   * @return {Promise} 結果
   */
  updateAllTabStatus() {
    return this.getAllTabs()
      .then((tabs) => Promise.all(
        tabs.map((tab) => this.updateTabStatus(tab))
      ));
  }

  /**
   * 指定されたURLデータは当拡張機能の制御が有効かどうかを返却
   *
   * @private
   * @param {object} urlData URLデータ
   * @return {Promise} 1: 有効, 0: 無効
   */
  isEnableFromUrlData(urlData) {
    return this.getData()
      .then((data) =>
        this.isExtensionWorkFromUrl(urlData.url).then((work) => [data, work]))
      .then(([data, work]) => {
        if (work === 0) {
          return 0;
        }

        let result =
          data['enabled-extension'] === 1 &&
          data['disabled-on'] === 0 &&
          data['disabled-domain'].indexOf(urlData.domain) === -1 &&
          data['disabled-page'].indexOf(urlData.url) === -1;

        if (result) {
          for (let i = 0; i < data['disabled-directory'].length; i++) {
            if (urlData.url.match(new RegExp(`^${data['disabled-directory'][i]}.*$`))) {
              result = false;
              break;
            }
          }
        }

        return result ? 1 : 0;
      });
  }

  /**
   * 指定されたURLは当拡張機能の制御が有効かどうかを返却
   *
   * @private
   * @param {string} url URL
   * @return {Promise} 1: 有効, 0: 無効
   */
  isEnableFromUrl(url) {
    return this.isEnableFromUrlData(Util.parseUrl(url));
  }

  /**
   * 現在のタブは当拡張機能の制御が有効かどうかを返却
   *
   * @private
   * @return {Promise} 1: 有効, 0: 無効
   */
  isEnable() {
    return this.getCurrentTabUrlData()
      .then((urlData) => this.isEnableFromUrlData(urlData));
  }

  /**
   * 現在のタブでシステム的な要因で拡張機能が動作可能か
   *
   * @public
   * @return {Promise} 1: 有効, 0: 無効
   */
  isExtensionWork() {
    return this.getCurrentTabUrlData()
      .then((urlData) => this.isExtensionWorkFromUrl(urlData.url));
  }

  /**
   * 指定されたURLでシステム的な要因で拡張機能が動作可能か
   *
   * @private
   * @param {string} url URL
   * @return {Promise} 1: 有効, 0: 無効
   */
  isExtensionWorkFromUrl(url) {
    const m = url.match(/^chrome:\/\/(.*)$/)
      || url.match(/^https:\/\/chrome\.google\.com\/webstore(.*)$/);

    return Promise.resolve(m ? 0 : 1);
  }

  /**
   * タブに関するログを取得
   *
   * @private
   * @param {number} tabId 基準となるタブID
   * @param {string} key キー
   * @return {Promise} タブに関するログ
   */
  getTabLog(tabId, key) {
    if (this.tabLog[tabId] && this.tabLog[tabId][key]) {
      return Promise.resolve(this.tabLog[tabId][key]);
    } else {
      return Promise.reject(new Error(`Tab log is none. [tabId: ${tabId}, key: ${key}]`));
    }
  }

  /**
   * タブに関するログを記録
   *
   * @private
   * @param {number} tabId タブID
   * @param {string} key キー
   * @param {object} value 値
   * @return {Promise} 結果
   */
  setTabLog(tabId, key, value) {
    if (!this.tabLog[tabId]) {
      this.tabLog[tabId] = {};
    }

    this.tabLog[tabId][key] = value;

    return Promise.resolve({tabId, key, value});
  }

  /**
   * タブに関するログを削除
   *
   * @private
   * @param {number} tabId タブID
   * @return {Promise} タブID
   */
  deleteTabLogIfExist(tabId) {
    if (this.tabLog[tabId]) {
      delete this.tabLog[tabId];
    }

    return Promise.resolve(tabId);
  }

  /**
   * [SYNC] ランタイムエラーを返却
   *
   * @private
   * @return {Error} エラーオブジェクト
   */
  getRuntimeError() {
    return this.chrome.runtime.lastError;
  }

  /**
   * [SYNC] 対象のキーを元にURLデータから適切な値を返却
   *
   * @private
   * @param {string} key キー
   * @param {object} data URLデータ
   * @return {*} 結果
   */
  urlDataValueFromKey(key, data) {
    if (key === 'disabled-domain') {
      return data.domain;
    } else if (key === 'disabled-directory') {
      return data.directory;
    } else {
      return data.url;
    }
  }

  /**
   * タブ削除のイベントハンドラ
   *
   * @private
   * @param {object} params パラメータ
   */
  onRemoveTabs(params) {
    Promise.all([this.getData(), this.getCurrentWindow(), this.getCurrentTab()])
      .then(([data, win, tab]) => {
        win.tabs.sort((a, b) => {
          if (a.index < b.index) {
            return params.align === 'right' ? -1 : 1;
          }

          if (a.index > b.index) {
            return params.align === 'right' ? 1 : -1;
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

          // 固定タブは閉じない=ONの場合は固定タブは除外
          if (data['no-close-fixed-tab'] === 1 && win.tabs[i].pinned) {
            continue;
          }

          if (activeTabId > -1) {
            removeTabs.push(win.tabs[i]);
          }
        }

        if (removeTabs.length > 0) {
          this.setTabLog(tab.id, 'remove', {
            align: params.align,
            tabs: removeTabs,
          });

          this.chrome.tabs.remove(removeTabs.map((item) => {
            return item.id;
          }));

          params.name = 'norifyRemoveTabs';
          params.removeTabsLength = removeTabs.length;

          this.chrome.tabs.sendMessage(activeTabId, params);
        }
      })
      .catch((e) => Logger.error(e));
  }

  /**
   * タブを元に戻すイベントハンドラ
   *
   * @private
   */
  onUndoRemoveTabs() {
    this.getCurrentTab()
      .then((tab) => this.getTabLog(tab.id, 'remove').then((log) => [tab, log]))
      .then(([tab, log]) =>
        this.deleteTabLogIfExist(tab.id).then(() => [tab, log]))
      .then(([tab, log]) => {
        log.tabs.map((item, i) => {
          this.chrome.tabs.create({
            url: item.url,
            pinned: item.pinned,
            selected: false,
            index: (log.align === 'right'
              ? tab.index + 1 + i
              : tab.index),
          });
        });
      })
      .catch((e) => Logger.error(e));
  }

  /**
   * タブオープンのイベントハンドラ
   *
   * @private
   * @param {object} params パラメータ
   */
  onOpenTab(params) {
    if (!params) {
      return;
    }

    this.getCurrentTab()
      .then((tab) => {
        params.index = tab.index + 1;
        this.chrome.tabs.create(params);
      })
      .catch((e) => Logger.error(e));
  }

  /**
   * 有効状態変更のイベントハンドラ
   *
   * @private
   */
  onToggleEnabled() {
    this.getData()
      .then((data) => this.setData(
        'enabled-extension',
        (data['enabled-extension'] === 0) ? 1 : 0
      ))
      .catch((e) => Logger.error(e));
  }
}
