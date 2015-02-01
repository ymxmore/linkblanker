
var LinkBlanker = chrome.extension.getBackgroundPage().LinkBlanker;
var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var LinkBlankerConstants = require('../constants/LinkBlankerConstants');
var Events = LinkBlankerConstants.Events;
var Types = LinkBlankerConstants.Types;
var assign = require('object-assign');

var PreferenceStore = assign({}, EventEmitter.prototype, {

  getAll: function (callback) {
    var data = LinkBlanker.getData();

    LinkBlanker.currentData(function (result) {
      var pageEnabled = true;

      Object.keys(data).forEach(function (k) {
        var v = data[k];

        switch (k) {
          case 'disabled-domain':
          case 'disabled-directory':
          case 'disabled-page':
            var item = LinkBlanker.preferenceValueFromId(k, result);

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

            if (pageEnabled && data[k]) {
              pageEnabled = false;
            }

            break;
          case 'shortcut-key-toggle-enabled':
            data[k] = v;
            break;
          default:
            data[k] = Boolean(v);
            break;
        }
      });

      data['disabled-off'] = pageEnabled;

      if (callback) {
        callback(data);
      }
    });
  },

  emitChange: function () {
    this.emit(Events.CHANGE);
  },

  /**
   * @param {function} callback
   */
  addChangeListener: function (callback) {
    this.on(Events.CHANGE, callback);
  },

  /**
   * @param {function} callback
   */
  removeChangeListener: function (callback) {
    this.removeListener(Events.CHANGE, callback);
  }
});

AppDispatcher.register(function (action) {
  switch(action.type) {
    case Types.SAVE:
      LinkBlanker.setData(action.data);
      PreferenceStore.emitChange();
      break;
  }
});

module.exports = PreferenceStore;
