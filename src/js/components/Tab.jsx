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
var FontIcon = MaterialUi.FontIcon;
var List = MaterialUi.List;
var ListItem = MaterialUi.ListItem;

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
        <Helmet title="Tab Tree"/>
        <List className="tab-tree">
          {this.state.data.map(this._getTabTree)}
        </List>
      </div>
    );
  },

  _onChange: function () {
    this.setState({
      data: TabStore.get(),
    });
  },

  _getTabTree: function (item, i) {
    return (
      <ListItem
        className="tab"
        leftIcon={
          <FontIcon
            className="remove-tab-tree"
            onClick={this._onClickRemoveChildren}/>
        }
        nestedItems={item.children.map(this._getTabTree)}
        initiallyOpen={true}
        primaryText={
          <div className="tab-title">
            <Image
              className="remove-tab"
              src={item.info.favIconUrl}
              url={item.info.url}
              tabStatus={item.info.status || 'complete'}
              alt={item.info.title}
              onClick={this._onClickRemoveTab}/>
            <h6>{item.info.title || item.info.url}</h6>
          </div>
        }
        key={item.info.id}
        onClick={this._onClickTab}
        data-id={item.info.id}/>
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
