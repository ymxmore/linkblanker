/**
 * components/Tree.jsx
 */

var Api = require('../utils/Api');
var Helmet = require('react-helmet');
// var ImageLoader = require('react-imageloader');
var Image = require('./Image.jsx');
var Logger = require('../utils/Logger');
var MaterialUi = require('material-ui');
var React = window.React = require('react');
var TreeStore = require('../stores/Tree');

var Tree = React.createClass({
  getInitialState: function () {
    return {
      data: [],
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
    Logger.debug('Tree.render > ', this.state);

    return (
      <div id="tree">
        <Helmet title="Tab Tree"/>
        {this.state.data.map(function (item) {
          return (
            <a key={item.info.id} data-id={item.info.id} className="tab">
              <header>
                <h6>{item.info.title}</h6>
                <Image
                  className="favicon"
                  src={item.info.favIconUrl}
                  width="16"
                  height="16"
                  alt={item.info.title}
                />
              </header>
            </a>
          );
        }.bind(this))}
      </div>
    );
  },

  _onChange: function () {
    this.setState({
      data: TreeStore.get(),
    });
  },

  _getPreLoader: function () {
    return (<div>Load</div>);
  },

  _getFavicon: function () {
    return (<div>Load</div>);
  },
});

module.exports = Tree;
