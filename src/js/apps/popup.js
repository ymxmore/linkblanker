/*
 * apps/popup.js
 */

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Logger from '../libs/Logger';
import PopupActions from '../actions/PopupActions';
import PopupStore from '../stores/PopupStore';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import React from 'react';
import ReactDOM from 'react-dom';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import blueGrey from '@material-ui/core/colors/blueGrey';
import createReactClass from 'create-react-class';
import cyan from '@material-ui/core/colors/cyan';
import grey from '@material-ui/core/colors/grey';
import {MuiThemeProvider, createMuiTheme} from '@material-ui/core/styles';

const keyMappings = {
  3: 'cancel',
  8: 'backspace',
  9: 'tab',
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

  91: 'command',
  92: 'command',
  93: 'command',
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

  96: '0(num)',
  97: '1(num)',
  98: '2(num)',
  99: '3(num)',
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

const theme = createMuiTheme({
  'typography': {
    fontFamily: [
      'ヒラギノ角ゴシック Pro',
      'Hiragino Kaku Gothic Pro',
      'メイリオ',
      'Meiryo',
      'Osaka',
      'ＭＳ Ｐゴシック',
      'MS PGothic',
      'sans-serif',
    ].join(','),
    color: '#757575',
  },
  'palette': {
    type: 'light',
    primary: {
      light: cyan['300'],
      main: cyan['500'],
      dark: cyan['700'],
      contrastText: '#fff',
    },
    secondary: {
      light: cyan['300'],
      main: cyan['500'],
      dark: cyan['700'],
      contrastText: blueGrey['900'],
    },
    text: {
      primary: grey['800'],
      secondary: grey['700'],
      disabled: grey['400'],
      hint: grey['400'],
      divider: grey['300'],
    },
  },
  'overrides': {
  },
});

const Popup = createReactClass({
  getInitialState() {
    return {
      'disabled-same-domain': false,
      'disabled-state': 'disabled-off',
      'enabled-background-open': false,
      'enabled-extension': false,
      'enabled-left-click': true,
      'enabled-middle-click': false,
      'enabled-multiclick-close': false,
      'enabled-right-click': false,
      'extention-work': false,
      'manifest': {},
      'no-close-fixed-tab': true,
      'shortcut-key-toggle-enabled': '',
      'shortcut-key-toggle-enabled-restore': true,
      'shortcut-key-toggle-enabled-value': '',
      'url-data': {},
      'url-enabled-state': true,
      'visible-link-state': false,
    };
  },

  componentDidMount() {
    PopupStore.addChangeListener(this.setAllState);
    this.setAllState();
  },

  componentWillUnmount() {
    PopupStore.removeChangeListener(this.setAllState);
  },

  handleChange(event) {
    switch (event.target.name) {
      case 'disabled-state':
        this.save(event.target.name, event.target.value);
        break;
      case 'enabled-extension':
      case 'enabled-background-open':
      case 'enabled-multiclick-close':
      case 'enabled-left-click':
      case 'enabled-middle-click':
      case 'enabled-right-click':
      case 'disabled-same-domain':
      case 'visible-link-state':
      case 'no-close-fixed-tab':
        this.save(event.target.name, event.target.checked);
        break;
    }
  },

  handleKeyDown(event) {
    switch (event.target.name) {
      case 'shortcut-key-toggle-enabled': {
        const state = {
          'shortcut-key-toggle-enabled': '',
          'shortcut-key-toggle-enabled-restore': false,
          'shortcut-key-toggle-enabled-value': '',
        };

        if (event.keyCode !== 46 && event.keyCode !== 8) {
          const keyMap = getKeyMapping(
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
    }
  },

  handleKeyUp(event) {
    switch (event.target.name) {
      case 'shortcut-key-toggle-enabled': {
        this.setState({
          'shortcut-key-toggle-enabled-restore': true,
        });

        this.save('shortcut-key-toggle-enabled', this.state['shortcut-key-toggle-enabled-value']);
        break;
      }
    }
  },

  save(key, value) {
    PopupActions.save(key, value);
  },

  setAllState() {
    PopupStore.getAll()
      .then((state) => {
        state['shortcut-key-toggle-enabled-value'] = state['shortcut-key-toggle-enabled'];
        const keyMap = getKeyMapping(state['shortcut-key-toggle-enabled']);
        state['shortcut-key-toggle-enabled'] = keyMap.keyNames.join(' + ');
        this.setState(state);
      })
      .catch((e) => Logger.error(e));
  },

  getHeader() {
    return (
      <header id="extension-name">
        <img
          className="icon"
          src={this.state['url-enabled-state'] ?
            '/img/icon-enabled.svgz' :
            '/img/icon-disabled.svgz'}
        />
        <span id="version-name">
          Version {this.state.manifest.version}
        </span>
      </header>
    );
  },

  getFooter() {
    return (
      <footer>
        <h2 className="popup-header">Links</h2>

        <ul className="popup-list">
          <li>
            <a href={this.state.manifest.homepage_url} title={this.state.manifest.name} target="_blank" rel="noreferrer noopener">
              {chrome.i18n.getMessage('title_link_help')}
            </a>
          </li>
        </ul>
      </footer>
    );
  },

  render() {
    if (!this.state['extention-work']) {
      return (
        <MuiThemeProvider theme={theme}>
          <div id="wrapper">
            {this.getHeader()}
            <section>
              <p>{chrome.i18n.getMessage('warn_extention_work')}</p>
            </section>
            {this.getFooter()}
          </div>
        </MuiThemeProvider>
      );
    }

    return (
      <MuiThemeProvider theme={theme}>
        <div id="wrapper">
          {this.getHeader()}
          <section>
            <h2 className="popup-header">
              {chrome.i18n.getMessage('title_whole_setting')}
            </h2>

            <ul className="popup-list">
              <li className="support">
                <FormControlLabel
                  control={
                    <Switch
                      name="enabled-extension"
                      checked={this.state['enabled-extension']}
                      onChange={this.handleChange} />
                  }
                  disabled={!this.state['extention-work']}
                  label={chrome.i18n.getMessage('title_operating_state')} />
              </li>
            </ul>
          </section>
          <section>
            <h2 className="popup-header">
              {chrome.i18n.getMessage('title_open_settings')}
            </h2>

            <ul className="popup-list">
              <li>
                <RadioGroup
                  name="disabled-state"
                  value={this.state['disabled-state']}
                  onChange={this.handleChange}>
                  <FormControlLabel
                    disabled={!this.state['enabled-extension']}
                    value="disabled-off"
                    control={<Radio/>}
                    label={chrome.i18n.getMessage('title_disabled_off')} />
                  <FormControlLabel
                    disabled={!this.state['enabled-extension']}
                    value="disabled-domain"
                    control={<Radio />}
                    label={chrome.i18n.getMessage('title_disabled_domain')} />
                  <FormControlLabel
                    disabled={!this.state['enabled-extension'] || this.state['url-data'].directory === ''}
                    value="disabled-directory"
                    control={<Radio />}
                    label={chrome.i18n.getMessage('title_disabled_directory')} />
                  <FormControlLabel
                    disabled={!this.state['enabled-extension']}
                    value="disabled-page"
                    control={<Radio />}
                    label={chrome.i18n.getMessage('title_disabled_page')} />
                  <FormControlLabel
                    disabled={!this.state['enabled-extension']}
                    value="disabled-on"
                    control={<Radio />}
                    label={chrome.i18n.getMessage('title_disabled_on')} />
                </RadioGroup>
              </li>
              <li className="split">
                <FormControlLabel
                  control={
                    <Switch
                      name="enabled-left-click"
                      checked={this.state['enabled-left-click']}
                      onChange={this.handleChange} />
                  }
                  disabled={!this.state['enabled-extension']}
                  label={chrome.i18n.getMessage('title_left_click')} />
              </li>
              <li>
                <FormControlLabel
                  control={
                    <Switch
                      name="enabled-middle-click"
                      checked={this.state['enabled-middle-click']}
                      onChange={this.handleChange} />
                  }
                  disabled={!this.state['enabled-extension']}
                  label={chrome.i18n.getMessage('title_middle_click')} />
              </li>
              <li>
                <FormControlLabel
                  control={
                    <Switch
                      name="enabled-right-click"
                      checked={this.state['enabled-right-click']}
                      onChange={this.handleChange} />
                  }
                  disabled={!this.state['enabled-extension']}
                  label={chrome.i18n.getMessage('title_right_click')} />
              </li>
              <li className="split">
                <FormControlLabel
                  control={
                    <Switch
                      name="enabled-background-open"
                      checked={this.state['enabled-background-open']}
                      onChange={this.handleChange} />
                  }
                  disabled={!this.state['enabled-extension']}
                  label={chrome.i18n.getMessage('title_background_open')} />
              </li>
              <li>
                <FormControlLabel
                  control={
                    <Switch
                      name="disabled-same-domain"
                      checked={this.state['disabled-same-domain']}
                      onChange={this.handleChange} />
                  }
                  disabled={!this.state['enabled-extension']}
                  label={chrome.i18n.getMessage('title_disabled_same_domain')} />
              </li>
            </ul>
          </section>
          <section>
            <h2 className="popup-header">
              {chrome.i18n.getMessage('title_close_settings')}
            </h2>

            <ul className="popup-list">
              <li>
                <FormControlLabel
                  control={
                    <Switch
                      name="enabled-multiclick-close"
                      checked={this.state['enabled-multiclick-close']}
                      onChange={this.handleChange} />
                  }
                  disabled={!this.state['enabled-extension']}
                  label={chrome.i18n.getMessage('title_multiclick_close')} />
              </li>
              <li>
                <FormControlLabel
                  control={
                    <Switch
                      name="no-close-fixed-tab"
                      checked={this.state['no-close-fixed-tab']}
                      onChange={this.handleChange} />
                  }
                  disabled={!this.state['enabled-extension']}
                  label={chrome.i18n.getMessage('title_no_close_fixed_tab')} />
                </li>
            </ul>
          </section>
          <section>
            <h2 className="popup-header">
              {chrome.i18n.getMessage('title_other')}
            </h2>

            <ul className="popup-list">
              <li className="support">
                <FormControlLabel
                  control={
                    <Switch
                      name="visible-link-state"
                      checked={this.state['visible-link-state']}
                      onChange={this.handleChange} />
                  }
                  disabled={!this.state['enabled-extension']}
                  label={chrome.i18n.getMessage('title_visible_link_state')} />
              </li>
              <li className="nmt">
                <TextField
                  name="shortcut-key-toggle-enabled"
                  placeholder="Enter the shortcut key"
                  fullWidth={true}
                  label={chrome.i18n.getMessage('title_enable_toggle_key')}
                  value={this.state['shortcut-key-toggle-enabled']}
                  disabled={!this.state['enabled-extension']}
                  onChange={this.handleChange}
                  onKeyDown={this.handleKeyDown}
                  onKeyUp={this.handleKeyUp}/>
              </li>
            </ul>
          </section>
          {this.getFooter()}
        </div>
      </MuiThemeProvider>
    );
  },
});

ReactDOM.render(<Popup/>, window.document.getElementById('popup'));

/**
 * キーマップを返却
 *
 * @param {number} keyCode
 * @return {Object} キーマップ
 */
function getKeyMapping(keyCode) {
  keyCode = keyCode || '';

  const keyCodes = keyCode.split(',').filter((val) => {
    return val !== '';
  }).map((val) => {
    return Number(val);
  });

  const keyNames = keyCodes.map((val) => {
    return keyMappings[val];
  });

  return {keyCodes, keyNames};
}
