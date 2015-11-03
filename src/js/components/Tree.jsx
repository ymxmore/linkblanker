/**
 * components/Tree.jsx
 */

var Api = require('../utils/Api');
var MaterialUi = require('material-ui');
var PreferenceMixin = require('../mixins/Preference');
var React = window.React = require('react');
var TreeStore = require('../stores/Tree');

var Tree = React.createClass({
  mixins: [ PreferenceMixin ],

  getInitialState: function () {
    return {
      data: {},
    };
  },

  componentDidMount: function () {
    TreeStore.addChangeListener(this._onChange);
    this._onChange();
  },

  componentWillUnmount: function () {
    TreeStore.removeChangeListener(this._onChange);
  },

  render: function () {
    return (
      <div id="tree">

      </div>
    );
  },

  _onChange: function () {
    this.setState({
      data: TreeStore.getAll(),
    });
  },
});

module.exports = Tree;
