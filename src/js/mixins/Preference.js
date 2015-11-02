/**
 * mixins/Preference.js
 */

var Api = require('../utils/Api');
var Logger = require('../utils/Logger');
var KeyMaps = require('../constants/KeyMaps');
var PreferenceActions = require('../actions/Preference');
var PreferenceStore = require('../stores/Preference');

var Preference = {
  getInitialState: function () {
    return {
      'system-enabled-state': true,
      'enabled-extension': false,
      'disabled-state': 'disabled-off',
      'disabled-same-domain': false,
      'enabled-background-open': false,
      'enabled-multiclick-close': false,
      'shortcut-key-toggle-enabled': '',

      'shortcut-key-toggle-enabled-restore': true,
      'shortcut-key-toggle-enabled-value': '',
    };
  },

  componentDidMount: function () {
    PreferenceStore.addChangeListener(this.setAllState);
    Api.listenMessage();
    this.setAllState();
  },

  componentWillUnmount: function () {
    PreferenceStore.removeChangeListener(this.setAllState);
  },

  setAllState: function () {
    var self = this;

    PreferenceStore.getAll(function (error, state) {
      if (error) {
        return;
      }

      Logger.debug('Preference.getAll callback', state);
      state['shortcut-key-toggle-enabled-value'] = state['shortcut-key-toggle-enabled'];

      var keyMap = self.getKeyMap(state['shortcut-key-toggle-enabled']);
      state['shortcut-key-toggle-enabled'] = keyMap.keyNames.join(' + ');

      self.setState(state);
    });
  },

  getKeyMap: function (keyCode) {
    keyCode = keyCode || '';

    var keyCodes = keyCode.split(',').filter(function (val) {
      return val !== '';
    }).map(function (val) {
      return Number(val);
    });

    var keyNames = keyCodes.map(function (val) {
      return KeyMaps[val];
    });

    return { keyCodes: keyCodes, keyNames: keyNames };
  },

  handleChange: function (event) {
    var state = {};

    switch (event.target.name) {
      case 'disabled-state':
        this.updateData(event.target.name, event.target.value);
        break;
      case 'enabled-extension':
      case 'enabled-background-open':
      case 'enabled-multiclick-close':
      case 'disabled-same-domain':
        this.updateData(event.target.name, event.target.checked);
        break;
    }
  },

  handleKeyDown: function (event) {
    switch (event.target.name) {
      case 'shortcut-key-toggle-enabled':
        var state = {
          'shortcut-key-toggle-enabled': '',
          'shortcut-key-toggle-enabled-restore': false,
          'shortcut-key-toggle-enabled-value': ''
        };

        if (46 !== event.keyCode && 8 !== event.keyCode) {
          var keyMap = this.getKeyMap(
            (this.state['shortcut-key-toggle-enabled-restore']) ?
              '' :
              this.state['shortcut-key-toggle-enabled-value']
          );

          if (keyMap.keyCodes.indexOf(event.keyCode) > -1) {
            return;
          }

          if (KeyMaps[event.keyCode]) {
            keyMap.keyNames.push(KeyMaps[event.keyCode]);
            keyMap.keyCodes.push(event.keyCode);

            state['shortcut-key-toggle-enabled'] = keyMap.keyNames.join(' + ');
            state['shortcut-key-toggle-enabled-value'] = keyMap.keyCodes.join(',');
          }
        }

        this.setState(state);

        break;
    }
  },

  handleKeyUp: function (event) {
    switch (event.target.name) {
      case 'shortcut-key-toggle-enabled':
        this.setState({
          'shortcut-key-toggle-enabled-restore': true,
        });

        this.updateData('shortcut-key-toggle-enabled', this.state['shortcut-key-toggle-enabled-value']);
        break;
    }
  },

  updateData: function (key, value) {
    PreferenceActions.updateData(key, value);
  },
};

module.exports = Preference;
