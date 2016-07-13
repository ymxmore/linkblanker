/*
 * actions/PreferenceAction.js
 */

import AppDispatcher from '../dispatcher/AppDispatcher';
import { Types } from '../constants/LinkBlankerConstants';

const PopupActions = {

  /**
   * Save Preference
   */
  save(key, value) {
    let data = {};

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
