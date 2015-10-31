/**
 * components/Popup.jsx
 */

var Api = require('../utils/Api');
var MaterialUi = require('material-ui');
var PreferenceMixin = require('../mixins/Preference');
var React = window.React = require('react');

var Popup = React.createClass({
  mixins: [ PreferenceMixin ],

  render: function () {
    return (
      <div id="popup">
        <header className="extension-name">
          <img
            className="icon"
            src={this.state['system-enabled-state'] ?
              '/img/icon-enabled.svgz' :
              '/img/icon-disabled.svgz'}
          />
          <span className="version-name">
            Version {Api.getVersion()}
          </span>
        </header>
        <section>
          <h5 className="header-underline">
            {Api.getI18nMessage('title_whole_setting')}
          </h5>

          <ul className="list">
            <li className="support">
              <MaterialUi.Toggle
                name="enabled-extension"
                label={Api.getI18nMessage('title_operating_state')}
                checked={this.state['enabled-extension']}
                onToggle={this.handleChange} />
            </li>
            <li>
              <MaterialUi.TextField
                name="shortcut-key-toggle-enabled"
                hintText="Enter the shortcut key"
                fullWidth={true}
                floatingLabelText={Api.getI18nMessage('title_enable_toggle_key')}
                value={this.state['shortcut-key-toggle-enabled']}
                onChange={this.handleChange}
                onKeyDown={this.handleKeyDown}
                onKeyUp={this.handleKeyUp} />
            </li>
            <li>
              <MaterialUi.Toggle
                name="enabled-background-open"
                label={Api.getI18nMessage('title_background_open')}
                checked={this.state['enabled-background-open']}
                onToggle={this.handleChange} />
            </li>
          </ul>
        </section>
        <section>
          <h5 className="header-underline">
            {Api.getI18nMessage('title_open_settings')}
          </h5>

          <ul className="list">
            <li>
              <MaterialUi.RadioButtonGroup
                name="disabled-state"
                valueSelected={this.state['disabled-state']}
                onChange={this.handleChange}>
                <MaterialUi.RadioButton
                  value="disabled-off"
                  label={Api.getI18nMessage('title_disabled_off')}
                  defaultChecked={true} />
                <MaterialUi.RadioButton
                  value="disabled-domain"
                  label={Api.getI18nMessage('title_disabled_domain')} />
                <MaterialUi.RadioButton
                  value="disabled-directory"
                  label={Api.getI18nMessage('title_disabled_directory')} />
                <MaterialUi.RadioButton
                  value="disabled-page"
                  label={Api.getI18nMessage('title_disabled_page')} />
              </MaterialUi.RadioButtonGroup>
            </li>
            <li className="split">
              <MaterialUi.Toggle
                name="disabled-same-domain"
                label={Api.getI18nMessage('title_disabled_same_domain')}
                checked={this.state['disabled-same-domain']}
                onToggle={this.handleChange} />
            </li>
          </ul>
        </section>
        <section>
          <h5 className="header-underline">
            {Api.getI18nMessage('title_close_settings')}
          </h5>

          <ul className="list">
            <li>
              <MaterialUi.Toggle
                name="enabled-multiclick-close"
                label={Api.getI18nMessage('title_multiclick_close')}
                checked={this.state['enabled-multiclick-close']}
                onToggle={this.handleChange} />
            </li>
          </ul>
        </section>
        <footer>
          <h5 className="header-underline">Links</h5>

          <ul className="list">
            <li>
              <a href="http://www.aozora-create.com/service/linkblanker" title="Link Blanker" target="_blank">
                {Api.getI18nMessage('title_link_help')}
              </a>
            </li>
          </ul>
        </footer>
      </div>
    );
  }
});

module.exports = Popup;
