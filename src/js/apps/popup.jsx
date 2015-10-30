/*
 * popup.jsx
 */

var LinkBlanker = chrome.extension.getBackgroundPage().LinkBlanker;
var React = window.React = require('react');
var ReactDOM = require('react-dom');
var PopupActions = require('../actions/PopupActions');
var PopupStore = require('../stores/PopupStore');
var MaterialUi = require('material-ui');
var InjectTapEventPlugin = require('react-tap-event-plugin');

// Needed for onTouchTap
// Can go away when react 1.0 release
// Check this repo:
// https://github.com/zilverline/react-tap-event-plugin
InjectTapEventPlugin();

var keyMappings = {
  3:  'cancel',
  8:  'backspace',
  9:  'tab',
  12: 'clear',
  13: 'enter',
  16: 'shift',
  17: 'ctrl',
  18: 'alt',
  19: 'pause',
  20: 'capslock',
  27: 'escape',
  28: 'maekouho',
  29: 'muhenkan',
  32: 'space',
  33: 'pageup',
  34: 'pagedown',
  35: 'end',
  36: 'home',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  41: 'select',
  42: 'printscreen',
  43: 'execute',
  44: 'snapshot',
  45: 'insert',
  46: 'delete',
  47: 'help',

  48: '0',
  49: '1',
  50: '2',
  51: '3',
  52: '4',
  53: '5',
  54: '6',
  55: '7',
  56: '8',
  57: '9',

  65: 'A',
  66: 'B',
  67: 'C',
  68: 'D',
  69: 'E',
  70: 'F',
  71: 'G',
  72: 'H',
  73: 'I',
  74: 'J',
  75: 'K',
  76: 'L',
  77: 'M',
  78: 'N',
  79: 'O',
  80: 'P',
  81: 'Q',
  82: 'R',
  83: 'S',
  84: 'T',
  85: 'U',
  86: 'V',
  87: 'W',
  88: 'X',
  89: 'Y',
  90: 'Z',

  91:  'command',
  92:  'command',
  93:  'command',
  145: 'scrolllock',
  186: 'colon',
  187: 'semicolon',
  188: 'comma',
  189: 'hyphen',
  190: 'period',
  191: 'slash',
  192: 'at',
  219: 'openbracket',
  220: 'yen',
  226: 'backslash',
  221: 'closebracket',
  222: 'caret',
  242: 'katakana',
  243: 'zenkaku',
  244: 'hankaku',

  96:  '0(num)',
  97:  '1(num)',
  98:  '2(num)',
  99:  '3(num)',
  100: '4(num)',
  101: '5(num)',
  102: '6(num)',
  103: '7(num)',
  104: '8(num)',
  105: '9(num)',
  106: 'multiply(num)',
  107: 'add(num)',
  108: 'enter(num)',
  109: 'subtract(num)',
  110: 'decimal(num)',
  111: 'devide(num)',
  144: 'lock(num)',
  112: 'f1',
  113: 'f2',
  114: 'f3',
  115: 'f4',
  116: 'f5',
  117: 'f6',
  118: 'f7',
  119: 'f8',
  120: 'f9',
  121: 'f10',
  122: 'f11',
  123: 'f12',
};

var Popup = React.createClass({
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
    PopupStore.addChangeListener(this.setAllState);
    this.setAllState();
  },

  componentWillUnmount: function () {
    PopupStore.removeChangeListener(this.setAllState);
  },

  handleChange: function (event) {
    var state = {};

    switch (event.target.name) {
      case 'disabled-state':
        this.save(event.target.name, event.target.value);
        break;
      case 'enabled-extension':
      case 'enabled-background-open':
      case 'enabled-multiclick-close':
      case 'disabled-same-domain':
        this.save(event.target.name, event.target.checked);
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
          var keyMap = getKeyMapping(
            (this.state['shortcut-key-toggle-enabled-restore']) ?
              '' :
              this.state['shortcut-key-toggle-enabled-value']
          );

          if (keyMap.keyCodes.indexOf(event.keyCode) > -1) {
            return;
          }

          if (keyMappings[event.keyCode]) {
            keyMap.keyNames.push(keyMappings[event.keyCode]);
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

        this.save('shortcut-key-toggle-enabled', this.state['shortcut-key-toggle-enabled-value']);
        break;
    }
  },

  save: function (key, value) {
    PopupActions.save(key, value);
  },

  setAllState: function () {
    var self = this;

    PopupStore.getAll(function (state) {
      state['shortcut-key-toggle-enabled-value'] = state['shortcut-key-toggle-enabled'];

      var keyMap = getKeyMapping(state['shortcut-key-toggle-enabled']);
      state['shortcut-key-toggle-enabled'] = keyMap.keyNames.join(' + ');

      self.setState(state);
    });
  },

  render: function () {
    return (
      <div id="wrapper">
        <header id="extension-name">
          <img
            className="icon"
            src={this.state['system-enabled-state'] ?
              '/img/icon-enabled.svgz' :
              '/img/icon-disabled.svgz'}
          />
          <span id="version-name">
            Version {LinkBlanker.manifest.version}
          </span>
        </header>
        <section>
          <h5 className="popup-header">
            {chrome.i18n.getMessage('title_whole_setting')}
          </h5>

          <ul className="popup-list">
            <li className="support">
              <MaterialUi.Toggle
                name="enabled-extension"
                label={chrome.i18n.getMessage('title_operating_state')}
                checked={this.state['enabled-extension']}
                onToggle={this.handleChange} />
            </li>
            <li>
              <MaterialUi.TextField
                name="shortcut-key-toggle-enabled"
                hintText="Enter the shortcut key"
                fullWidth={true}
                floatingLabelText={chrome.i18n.getMessage('title_enable_toggle_key')}
                value={this.state['shortcut-key-toggle-enabled']}
                onChange={this.handleChange}
                onKeyDown={this.handleKeyDown}
                onKeyUp={this.handleKeyUp} />
            </li>
            <li>
              <MaterialUi.Toggle
                name="enabled-background-open"
                label={chrome.i18n.getMessage('title_background_open')}
                checked={this.state['enabled-background-open']}
                onToggle={this.handleChange} />
            </li>
          </ul>
        </section>
        <section>
          <h5 className="popup-header">
            {chrome.i18n.getMessage('title_open_settings')}
          </h5>

          <ul className="popup-list">
            <li>
              <MaterialUi.RadioButtonGroup
                name="disabled-state"
                valueSelected={this.state['disabled-state']}
                onChange={this.handleChange}>
                <MaterialUi.RadioButton
                  value="disabled-off"
                  label={chrome.i18n.getMessage('title_disabled_off')}
                  defaultChecked={true} />
                <MaterialUi.RadioButton
                  value="disabled-domain"
                  label={chrome.i18n.getMessage('title_disabled_domain')} />
                <MaterialUi.RadioButton
                  value="disabled-directory"
                  label={chrome.i18n.getMessage('title_disabled_directory')} />
                <MaterialUi.RadioButton
                  value="disabled-page"
                  label={chrome.i18n.getMessage('title_disabled_page')} />
              </MaterialUi.RadioButtonGroup>
            </li>
            <li className="split">
              <MaterialUi.Toggle
                name="disabled-same-domain"
                label={chrome.i18n.getMessage('title_disabled_same_domain')}
                checked={this.state['disabled-same-domain']}
                onToggle={this.handleChange} />
            </li>
          </ul>
        </section>
        <section>
          <h5 className="popup-header">
            {chrome.i18n.getMessage('title_close_settings')}
          </h5>

          <ul className="popup-list">
            <li>
              <MaterialUi.Toggle
                name="enabled-multiclick-close"
                label={chrome.i18n.getMessage('title_multiclick_close')}
                checked={this.state['enabled-multiclick-close']}
                onToggle={this.handleChange} />
            </li>
          </ul>
        </section>
        <footer>
          <h5 className="popup-header">Links</h5>

          <ul className="popup-list">
            <li>
              <a href="http://www.aozora-create.com/service/linkblanker" title="Link Blanker" target="_blank">
                {chrome.i18n.getMessage('title_link_help')}
              </a>
            </li>
          </ul>
        </footer>
      </div>
    );
  }
});

ReactDOM.render(<Popup />, document.getElementById('popup'));

function getKeyMapping (keyCode) {
  keyCode = keyCode || '';

  var keyCodes = keyCode.split(',').filter(function (val) {
    return val !== '';
  }).map(function (val) {
    return Number(val);
  });

  var keyNames = keyCodes.map(function (val) {
    return keyMappings[val];
  });

  return { keyCodes: keyCodes, keyNames: keyNames };
}
