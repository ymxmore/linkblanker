/**
 * components/NotFound.jsx
 */

var React = require('react');

var NotFound = React.createClass({
  render: function () {
    return (
      <h1>The requested page could not be found.</h1>
    );
  }
});

module.exports = NotFound;
