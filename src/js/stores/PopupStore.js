/*
 * stores/PopupStore.js
 */

import {EventEmitter} from 'events';
import {Events, Types} from '../constants/LinkBlankerConstants';
import AppDispatcher from '../dispatcher/AppDispatcher';

const LinkBlanker = chrome.extension.getBackgroundPage().LinkBlanker;

const DISABLEDS = [
  'disabled-domain',
  'disabled-directory',
  'disabled-page',
  'disabled-on',
];

const PreferenceStore = Object.assign({}, EventEmitter.prototype, {

  /**
   * 全データを返却
   *
   * @param {function(Error, Object)} callback
   */
  getAll: (callback) => {
    const data = LinkBlanker.getData();

    LinkBlanker.getCurrentData((error, result) => {
      if (error) {
        if (callback) {
          callback(error, null);
        }
        return;
      }

      Object.keys(data).forEach((k) => {
        const v = data[k];

        switch (k) {
          case 'disabled-domain':
          case 'disabled-directory':
          case 'disabled-page': {
            const item = LinkBlanker.preferenceValueFromId(k, result);

            if ('disabled-directory' === k) {
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
      data['system-enabled-state'] = Boolean(LinkBlanker.isEnableFromUrl(result.url));
      data['disabled-state'] = 'disabled-off';

      DISABLEDS.forEach((value) => {
        if (data[value]) {
          data['disabled-state'] = value;
        }

        delete data[value];
      });

      if (callback) {
        callback(null, data);
      }
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

      LinkBlanker.setData(data, () => {
        PreferenceStore.emitChange();
      });

      break;
    }
  }
});

module.exports = PreferenceStore;
