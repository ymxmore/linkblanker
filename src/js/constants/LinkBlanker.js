/**
 * constants/LinkBlankerConstants.js
 */

var keyMirror = require('keymirror');

module.exports = {
  EventType: keyMirror({
    CHANGE: null,
    TRY_UPDATE_DATA: null,
    RECEIVE_MESSAGE: null,
  }),

  MessageName: keyMirror({
    UPDATED_DATA: null,
    SAVED_TAB_LOG: null,
    DELETED_TAB_LOG: null,
    UPDATE_TAB_STATUS: null,
    OPEN_TAB: null,
    REMOVE_TABS: null,
    UNDO_REMOVE_TABS: null,
    TOGGLE_ENABLED: null,
  }),

  StorageType: keyMirror({
    PERSISTENCE: null,
    EPHEMERAL: null,
  })
};
