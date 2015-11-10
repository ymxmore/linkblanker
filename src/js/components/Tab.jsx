/**
 * components/Tab.jsx
 */

var Image = require('./Image.jsx');
var MaterialUi = require('material-ui');
var React = require('react');
var FontIcon = MaterialUi.FontIcon;
var IconButton = MaterialUi.IconButton;

var Tab = React.createClass({
  propTypes: {
    id: React.PropTypes.number.isRequired,
    url: React.PropTypes.string.isRequired,
    title: React.PropTypes.string,
    status: React.PropTypes.string,
    favIconUrl: React.PropTypes.string,
    nestedTabs: React.PropTypes.array,
    onClickTabTitle: React.PropTypes.func,
    onClickRemoveChildrenWithMe: React.PropTypes.func,
    onClickRemoveChildren: React.PropTypes.func,
    onClickRemoveTab: React.PropTypes.func,
  },

  getDefaultProps: function () {
    return {
      title: '',
      status: 'complete',
      favIconUrl: '',
      onClickTabTitle: function () {},
      onClickRemoveChildrenWithMe: function () {},
      onClickRemoveChildren: function () {},
      onClickRemoveTab: function () {},
    };
  },

  getInitialState: function () {
    return {
      tabClassName: 'tab',
      tabTreeClassName: 'tab-tree',
      tabTitleClassName: 'tab-title',
    };
  },

  render: function () {
    var nestedTabs = '';

    if (this.props.nestedTabs.length > 0) {
      nestedTabs = (
        <div className={this.state.tabTreeClassName}>
          <div
            className="tab-tree-icon"
            onMouseOver={this._onMouseOverRemoveTabTree}
            onMouseOut={this._onMouseOutRemoveTabTree}>
            <FontIcon
              className="fa fa-angle-right chevron"/>
            <IconButton
              iconClassName="fa fa-times remove-tab-tree"
              onClick={this.props.onClickRemoveChildren}/>
          </div>
          {this.props.nestedTabs}
        </div>
      );
    }

    return (
      <div
        className={this.state.tabClassName}
        key={this.props.id}
        data-id={this.props.id}
        title={this.props.title || this.props.url}>

        <div
          className="tab-tree-icon-with-me"
          onMouseOver={this._onMouseOverRemoveTabTreeWithMe}
          onMouseOut={this._onMouseOutRemoveTabTreeWithMe}>
          <FontIcon
            className="fa fa-bars chevron"/>
          <IconButton
            iconClassName="fa fa-times remove-tab-tree-with-me"
            onClick={this.props.onClickRemoveChildrenWithMe}/>
        </div>
        <div
          className="tab-icon"
          onMouseOver={this._onMouseOverRemoveTab}
          onMouseOut={this._onMouseOutRemoveTab}>
          <Image
            className="favicon"
            src={this.props.favIconUrl}
            url={this.props.url}
            width="16"
            height="16"
            tabStatus={this.props.status || 'complete'}
            alt={this.props.title}/>
          <IconButton
            iconClassName="fa fa-times remove-tab"
            onClick={this.props.onClickRemoveTab}/>
        </div>

        <h6
          className={this.state.tabTitleClassName}
          onMouseOver={this._onMouseOverTabTitle}
          onMouseOut={this._onMouseOutTabTitle}
          onClick={this.props.onClickTabTitle}>
          {this.props.title || this.props.url}
        </h6>

        {nestedTabs}
      </div>
    );
  },

  create: function (fragments) {
    var newFragments = {};
    var validChildrenCount = 0;
    var firstKey = null;

    // Only create non-empty key fragments
    for (var key in fragments) {
      var currentChild = fragments[key];

      if (currentChild) {
        if (validChildrenCount === 0) firstKey = key;
        newFragments[key] = currentChild;
        validChildrenCount++;
      }
    }

    if (validChildrenCount === 0) return undefined;
    if (validChildrenCount === 1) return newFragments[firstKey];
    return CreateFragment(newFragments);
  },

  _onMouseOverRemoveTabTreeWithMe: function () {
    this.setState({
      tabClassName: 'tab tab-remove-range'
    });
  },

  _onMouseOutRemoveTabTreeWithMe: function () {
    this.setState({
      tabClassName: 'tab'
    });
  },

  _onMouseOverRemoveTabTree: function () {
    this.setState({
      tabTreeClassName: 'tab-tree tab-remove-range'
    });
  },

  _onMouseOutRemoveTabTree: function () {
    this.setState({
      tabTreeClassName: 'tab-tree'
    });
  },

  _onMouseOverRemoveTab: function () {
    this.setState({
      tabTitleClassName: 'tab-title tab-remove-range'
    });
  },

  _onMouseOutRemoveTab: function () {
    this.setState({
      tabTitleClassName: 'tab-title'
    });
  },

  _onMouseOverTabTitle: function () {
    this.setState({
      tabTitleClassName: 'tab-title tab-active-range'
    });
  },

  _onMouseOutTabTitle: function () {
    this.setState({
      tabTitleClassName: 'tab-title'
    });
  },

});

module.exports = Tab;
