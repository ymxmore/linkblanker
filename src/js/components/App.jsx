/**
 * components/App.jsx
 */

var Api = require('../utils/Api');
var Helmet = require('react-helmet');
var React = require('react');
var PreferenceMixin = require('../mixins/Preference');

var App = React.createClass({
  mixins: [ PreferenceMixin ],

  getInitialState: function () {
    return {};
  },

  componentDidMount: function () {
    Api.subscribeMessageEvent();
  },

  componentWillUnmount: function () {
    Api.unSubscribeMessageEvent();
  },

  render: function () {
    return (
      <div id="app">
        <Helmet titleTemplate="%s - LinkBlanker" />
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
