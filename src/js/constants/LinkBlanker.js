/**
 * constants/LinkBlankerConstants.js
 */

var keyMirror = require('keymirror');

module.exports = {
  EventType: keyMirror({
    CHANGE: null,
    SAVE: null,
    RECEIVE_MESSAGE: null,
  }),

  MessageName: keyMirror({
    SAVED: null,
    UPDATE_TAB_STATUS: null,
    OPEN_TAB: null,
    REMOVE_TABS: null,
    UNDO_REMOVE_TABS: null,
    TOGGLE_ENABLED: null,
  }),
};
