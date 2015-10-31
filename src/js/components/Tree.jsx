/**
 * components/Tree.jsx
 */

var Api = require('../utils/Api');
var MaterialUi = require('material-ui');
var PreferenceMixin = require('../mixins/Preference');
var React = window.React = require('react');

var Tree = React.createClass({
  mixins: [ PreferenceMixin ],

  render: function () {
    return (
      <div id="tree">
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
      </div>
    );
  }
});

module.exports = Tree;
