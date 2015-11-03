/**
 * stores/Tree.js
 */

var Api = require('../utils/Api');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var LinkBlankerConstants = require('../constants/LinkBlanker');
var Logger = require('../utils/Logger');
var EventType = LinkBlankerConstants.EventType;
var MessageName = LinkBlankerConstants.MessageName;
var assign = require('object-assign');

/**
 * TabLogs
 */
var _tabLogs = {};

var TreeStore = assign({}, EventEmitter.prototype, {

  getAll: function (callback) {
    return _tabLogs;
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
    case EventType.RECEIVE_MESSAGE:
      var response = action.args[0];

      if ('name' in response) {
        switch (response.name) {
          case MessageName.SAVED_TAB_LOG:
          case MessageName.DELETED_TAB_LOG:
            _tabLogs = response.data;
            TreeStore.emitChange();
            break;
        }
      }

      break;
  }
});

module.exports = TreeStore;
