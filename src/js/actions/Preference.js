/**
 * actions/Preference.js
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var LinkBlankerConstants = require('../constants/LinkBlanker');
var EventType = LinkBlankerConstants.EventType;

var Preference = {

  /**
   * Save Data
   */
  save: function (key, value) {
    var data = {};

    if ('object' === typeof key){
      data = key;
    } else {
      data[key] = value;
    }

    AppDispatcher.dispatch({
      type: EventType.TRY_SAVE,
      data: data
    });
  },

  /**
   * Receive message
   */
  receiveMessage: function () {
    AppDispatcher.dispatch({
      type: EventType.RECEIVE_MESSAGE,
      args: Array.prototype.slice.call(arguments),
    });
  }

};

module.exports = Preference;
