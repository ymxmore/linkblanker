/**
 * components/App.jsx
 */

var React = require('react');

var App = React.createClass({
  getInitialState: function () {
    return {};
  },

  componentDidMount: function () {
  },

  render: function () {
    return (
      <div id="app">
        {this.props.children}
      </div>
    );
  }
});

module.exports = App;
