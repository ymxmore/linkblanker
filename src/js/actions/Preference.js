/**
 * actions/Preference.js
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var LinkBlankerConstants = require('../constants/LinkBlanker');
var EventType = LinkBlankerConstants.EventType;

var Preference = {

  /**
   * Update Data
   */
  updateData: function (key, value) {
    var data = {};

    if ('object' === typeof key){
      data = key;
    } else {
      data[key] = value;
    }

    AppDispatcher.dispatch({
      type: EventType.TRY_UPDATE_DATA,
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
