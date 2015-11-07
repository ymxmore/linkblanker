/**
 * components/Tree.jsx
 */

var Api = require('../utils/Api');
var Helmet = require('react-helmet');
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
    // Logger.debug('Tree.render > ', this.state);

    return (
      <div id="tree">
        <Helmet title="Tab Tree"/>
        {this.state.data.map(this._getTabTree)}
      </div>
    );
  },

  _onChange: function () {
    this.setState({
      data: TreeStore.get(),
    });
  },

  _getTabTree: function (item, i) {
    var children = '';

    if (item.children.length > 0) {
      children = item.children.map(this._getTabTree);
    }

    return (
      <div className="tab-tree-group" key={i}>
        <i
          className="remove-children"
          onClick={this._onClickRemoveChildren}/>
        <div className="tab-tree">
          <div className="tab-icon">
            <Image
              className="favicon"
              src={item.info.favIconUrl}
              url={item.info.url}
              width="16"
              height="16"
              tabStatus={item.info.status || 'complete'}
              alt={item.info.title}/>
            <i
              className="fa fa-times remove-tab"
              onClick={this._onClickRemoveTab}/>
          </div>
          <div
            className="tab"
            key={item.info.id}
            data-id={item.info.id}
            title={item.info.title || item.info.url}
            onClick={this._onClickTab}>
            <h6>{item.info.title || item.info.url}</h6>
          </div>
          {children}
        </div>
      </div>
    );
  },

  _onClickTab: function () {
    // TODO: action creatorを通してbackgroundに処理を依頼
  },

  _onClickRemoveChildren: function () {
    // TODO: action creatorを通してbackgroundに処理を依頼
  },

  _onClickRemoveTab: function () {
    // TODO: action creatorを通してbackgroundに処理を依頼
  },
});

module.exports = Tree;
