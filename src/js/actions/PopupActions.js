/*
 * PreferenceAction.js
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var LinkBlankerConstants = require('../constants/LinkBlankerConstants');
var Types = LinkBlankerConstants.Types;

var PopupActions = {

  /**
   * Save Preference
   */
  save: function (key, value) {
    var data = {};

    if ('object' === typeof key){
      data = key;
    } else {
      data[key] = value;
    }

    AppDispatcher.dispatch({
      type: Types.SAVE,
      data: data
    });
  }

};

module.exports = PopupActions;
