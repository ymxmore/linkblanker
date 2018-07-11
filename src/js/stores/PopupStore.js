/*
 * stores/PopupStore.js
 */

import AppDispatcher from '../dispatcher/AppDispatcher';
import Logger from '../libs/Logger';
import {EventEmitter} from 'events';
import {Events, Types} from '../constants/LinkBlankerConstants';

const linkBlanker = chrome.extension.getBackgroundPage().LinkBlanker;

const DISABLEDS = [
  'disabled-domain',
  'disabled-directory',
  'disabled-page',
  'disabled-on',
];

/**
 * 設定ストア
 */
const PreferenceStore = Object.assign({}, EventEmitter.prototype, {
  /**
   * 全データを返却
   *
   * @return {Promise} 全データ
   */
  getAll: () => {
    const proms = [
      linkBlanker.getData(),
      linkBlanker.getCurrentTabUrlData(),
      linkBlanker.isExtensionWork(),
      linkBlanker.isEnable(),
    ];

    return Promise.all(proms)
      .then(([data, urlData, extWork, enabled]) => {
        Object.keys(data).forEach((k) => {
          const v = data[k];

          switch (k) {
            case 'disabled-domain':
            case 'disabled-directory':
            case 'disabled-page': {
              const item = linkBlanker.urlDataValueFromKey(k, urlData);

              if (k === 'disabled-directory') {
                let exist = false;

                for (let i = 0; i < v.length; i++) {
                  if (item.match(new RegExp(`^${v[i]}.*$`))) {
                    exist = true;
                    break;
                  }
                }

                data[k] = exist;
              } else {
                data[k] = (v.indexOf(item) > -1);
              }

              break;
            }
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
              data[k] = Boolean(v);
              break;
            default:
              data[k] = v;
              break;
          }
        });

        // build virtual fileld
        data['url-enabled-state'] = Boolean(enabled);
        data['disabled-state'] = 'disabled-off';

        DISABLEDS.forEach((value) => {
          if (data[value]) {
            data['disabled-state'] = value;
          }

          delete data[value];
        });

        data['url-data'] = urlData;
        data['extention-work'] = Boolean(extWork);
        data['manifest'] = linkBlanker.manifest;

        return data;
      });
  },

  /**
   * チェンジイベントを発火
   */
  emitChange: () => {
    PreferenceStore.emit(Events.CHANGE);
  },

  /**
   * 指定されたチェンジイベントを追加
   *
   * @param {function(Object)} callback
   */
  addChangeListener: (callback) => {
    PreferenceStore.on(Events.CHANGE, callback);
  },

  /**
   * 指定されたチェンジイベントを削除
   *
   * @param {function(Object)} callback
   */
  removeChangeListener: (callback) => {
    PreferenceStore.removeListener(Events.CHANGE, callback);
  },
});

AppDispatcher.register((action) => {
  switch (action.type) {
    case Types.SAVE: {
      const data = Object.assign({}, action.data);

      if (data['disabled-state']) {
        DISABLEDS.forEach((value) => {
          data[value] = (value === data['disabled-state']);
        });

        // delete virtual fileld
        delete data['disabled-state'];
      }

      linkBlanker.setData(data)
        .then(() => PreferenceStore.emitChange())
        .catch((e) => Logger.error(e));

      break;
    }
  }
});

module.exports = PreferenceStore;
