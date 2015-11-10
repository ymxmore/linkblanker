/**
 * components/TabList.jsx
 */

var Api = require('../utils/Api');
var Helmet = require('react-helmet');
var Logger = require('../utils/Logger');
var React = window.React = require('react');
var Tab = require('./Tab.jsx');
var TabListStore = require('../stores/TabList');

var TabList = React.createClass({
  getInitialState: function () {
    return {
      data: [],
    };
  },

  componentDidMount: function () {
    TabListStore.addChangeListener(this._onChange);
    this._onChange();
  },

  componentWillUnmount: function () {
    TabListStore.removeChangeListener(this._onChange);
  },

  render: function () {
    // Logger.debug('Tab.render > ', this.state);

    return (
      <div id="tab-list" className="tab-list tree">
        <Helmet title="Tab List"/>
        {this.state.data.map(this._getTabList)}
      </div>
    );
  },

  _onChange: function () {
    this.setState({
      data: TabListStore.get(),
    });
  },

  _getTabList: function (item, i) {
    return (
      <Tab
        key={item.info.id}
        id={item.info.id}
        url={item.info.url}
        title={item.info.title}
        status={item.info.status}
        favIconUrl={item.info.favIconUrl}
        nestedTabs={item.children.map(this._getTabList)}
      />
    );
    // return (
    //   <div
    //     className="tab"
    //     key={item.info.id}
    //     data-id={item.info.id}
    //     title={item.info.title || item.info.url}
    //     onClick={this._onClickTab}>

    //     <div className="tab-tree-icon">
    //       <FontIcon
    //         className="fa fa-angle-right chevron"/>
    //       <IconButton
    //         iconClassName="fa fa-times remove-tab-tree-with-me"
    //         onClick={this._onClickRemoveChildrenWithMe}/>
    //     </div>
    //     <div className="tab-icon">
    //       <Image
    //         className="favicon"
    //         src={item.info.favIconUrl}
    //         url={item.info.url}
    //         width="16"
    //         height="16"
    //         tabStatus={item.info.status || 'complete'}
    //         alt={item.info.title}/>
    //       <IconButton
    //         iconClassName="fa fa-times remove-tab"
    //         onClick={this._onClickRemoveTab}/>
    //     </div>

    //     <h6 className="tab-title">{item.info.title || item.info.url}</h6>

    //     <div className="tab-tree">
    //       {item.children.map(this._getTabList)}
    //     </div>
    //   </div>
    // );
  },

  _onClickTab: function () {
    // TODO: action creatorを通してbackgroundに処理を依頼
  },

  _onClickRemoveChildrenWithMe: function () {

  },

  _onClickRemoveChildren: function () {
    // TODO: action creatorを通してbackgroundに処理を依頼
  },

  _onClickRemoveTab: function () {
    // TODO: action creatorを通してbackgroundに処理を依頼
  },
});

module.exports = TabList;
