/**
 * components/App.jsx
 */

var Api = require('../utils/Api');
var React = require('react');
var PreferenceMixin = require('../mixins/Preference');

var App = React.createClass({
  mixins: [ PreferenceMixin ],

  getInitialState: function () {
    return {};
  },

  render: function () {
    return (
      <div id="app">
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
        {this.props.children}
      </div>
    );
  }
});

module.exports = App;
