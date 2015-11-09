/**
 * components/Tab.jsx
 */

var Api = require('../utils/Api');
var Helmet = require('react-helmet');
var Image = require('./Image.jsx');
var Logger = require('../utils/Logger');
var MaterialUi = require('material-ui');
var React = window.React = require('react');
var TabStore = require('../stores/Tab');

var IconButton = MaterialUi.IconButton;

var Tab = React.createClass({
  getInitialState: function () {
    return {
      data: [],
    };
  },

  componentDidMount: function () {
    TabStore.addChangeListener(this._onChange);
    this._onChange();
  },

  componentWillUnmount: function () {
    TabStore.removeChangeListener(this._onChange);
  },

  render: function () {
    // Logger.debug('Tab.render > ', this.state);

    return (
      <div id="tree">
        <Helmet title="Tab List"/>
        {this.state.data.map(this._getTabList)}
      </div>
    );
  },

  _onChange: function () {
    this.setState({
      data: TabStore.get(),
    });
  },

  _getTabList: function (item, i) {
    return (
      <div className="tab-tree">
        <div className="tab-tree-icon">
          <IconButton
            iconClassName="fa fa-chevron-right"
            onClick={this._onClickRemoveChildren}/>
          <IconButton
            iconClassName="fa fa-times"
            onClick={this._onClickRemoveChildren}/>
        </div>
        <div className="tab-icon">
          <Image
            className="favicon"
            src={item.info.favIconUrl}
            url={item.info.url}
            width="16"
            height="16"
            tabStatus={item.info.status || 'complete'}
            alt={item.info.title}/>
          <IconButton
            iconClassName="fa fa-times remove-tab"
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
        {item.children.map(this._getTabList)}
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

module.exports = Tab;
