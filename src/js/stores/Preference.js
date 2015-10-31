/**
 * stores/Preference.js
 */

var Api = require('../utils/Api');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var LinkBlankerConstants = require('../constants/LinkBlanker');
var Logger = require('../utils/Logger');
var EventType = LinkBlankerConstants.EventType;
var MessageName = LinkBlankerConstants.MessageName;
var assign = require('object-assign');

var disableds = [ 'disabled-domain', 'disabled-directory', 'disabled-page' ];
var isBackgroundAttached = false;
var data = {};

var PreferenceStore = assign({}, EventEmitter.prototype, {

  getAll: function (callback) {
    var data = Api.getLinkBlanker().getData();

    Api.getLinkBlanker().currentData(function (result) {
      Object.keys(data).forEach(function (k) {
        var v = data[k];

        switch (k) {
          case 'disabled-domain':
          case 'disabled-directory':
          case 'disabled-page':
            var item = Api.getLinkBlanker().preferenceValueFromId(k, result);

            if ('disabled-directory' === k) {
              var exist = false;

              for (var i = 0; i < v.length; i++) {
                if (item.match(new RegExp('^' + v[i] + '.*$'))) {
                  exist = true;
                  break;
                }
              }

              data[k] = exist;
            } else {
              data[k] = (v.indexOf(item) > -1);
            }

            break;
          case 'enabled-extension':
          case 'enabled-background-open':
          case 'enabled-multiclick-close':
          case 'disabled-same-domain':
            data[k] = Boolean(v);
            break;
          default:
            data[k] = v;
            break;
        }
      });

      // build virtual fileld
      data['system-enabled-state'] = Boolean(Api.getLinkBlanker().enableFromUrl(result.url));
      data['disabled-state'] = 'disabled-off';

      disableds.forEach(function (value) {
        if (data[value]) {
          data['disabled-state'] = value;
        }

        delete data[value];
      });

      if (callback) {
        callback(data);
      }
    });
  },

  emitChange: function () {
    this.emit(EventType.CHANGE);
  },

  /**
   * @param {function} callback
   */
  addChangeListener: function (callback) {
    this.on(EventType.CHANGE, callback);
  },

  /**
   * @param {function} callback
   */
  removeChangeListener: function (callback) {
    this.removeListener(EventType.CHANGE, callback);
  },
});

AppDispatcher.register(function (action) {
  switch(action.type) {
    case EventType.TRY_SAVE:
      if (action.data['disabled-state']) {
        disableds.forEach(function (value) {
          action.data[value] = (value === action.data['disabled-state']) ? true : false;
        });

        // delete virtual fileld
        delete action.data['disabled-state'];
      }

      Api.getLinkBlanker().setData(action.data);

      break;
    case EventType.RECEIVE_MESSAGE:
      Logger.debug('receive message on store', action);
      var response = action.args[0];

      if ('name' in response) {
        switch (response.name) {
          case MessageName.SAVED:
            PreferenceStore.emitChange();
            break;
        }
      }
      break;
  }
});

module.exports = PreferenceStore;
