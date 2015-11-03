/**
 * utils/Api.js
 */

var LinkBlankerConstants = require('../constants/LinkBlanker');
var PreferenceActions = require('../actions/Preference');
var EventType = LinkBlankerConstants.EventType;

/**
 * Api
 */
var Api = {

  /**
   * ロケールにあわせたメッセージを返却
   */
  getI18nMessage: function (key) {
    return chrome.i18n.getMessage(key);
  },

  /**
   * イベントリスナを登録
   */
  listenMessage: function () {
    chrome.extension.onMessage.addListener(function() {
      PreferenceActions.receiveMessage.apply(null, Array.prototype.slice.call(arguments));
    });
  },

  /**
   * バックグラウンドのLinkBlankerインスタンスを取得
   */
  getLinkBlanker: function () {
    return chrome.extension.getBackgroundPage().LinkBlanker;
  },

  /**
   * バージョン情報を返却
   */
  getVersion: function () {
    return this.getLinkBlanker().getManifest().version;
  },

  isArray: function (target) {
    return '[object Array]' === Object.prototype.toString.call(target);
  }
};

module.exports = Api;
