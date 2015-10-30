/*
 * Options.jsx
 */

var React = require('react');

var Options = React.createClass({
  getInitialState: function () {
    return {
    };
  },

  componentDidMount: function () {
  },

  render: function () {
    return (
      <div>
        <p>Options!</p>
        {this.props.children}
      </div>
    );
  }
});

module.exports = Options;
