/**
 * components/Image.jsx
 */

var Api = require('../utils/Api');
var assign = require('object-assign');
var Logger = require('../utils/Logger');
var MaterialUi = require('material-ui');
var React = require('react');
var request = require('superagent');
var Avatar = MaterialUi.Avatar;
var FontIcon = MaterialUi.FontIcon;

var Image = React.createClass({
  propTypes: {
    src: React.PropTypes.string.isRequired,
    url: React.PropTypes.string,
    tabStatus: React.PropTypes.string,
  },

  getDefaultProps: function () {
    return {
      src: '',
      url: '',
      tabStatus: 'loading',
    };
  },

  getInitialState: function () {
    return {
      src: '',
      url: '',
      dataURL: '',
      tabStatus: 'loading',
      imgProps: {},
    };
  },

  componentWillReceiveProps: function (nextProps) {
    this._setState(nextProps);
  },

  componentDidMount: function () {
    this._setState(this.props);
  },

  render: function () {
    var className = (this.state.imgProps.className || '');

    switch (this.state.dataURL) {
      case 'loading':
        className += ' fa fa-2x fa-circle-o-notch fa-spin';
        return (<FontIcon className={className}/>);
      case 'faild':
        className += ' fa fa-2x fa-sticky-note-o';
        return (<FontIcon className={className}/>);
    }
// console.log(this.state.dataURL);
    return (
      <FontIcon {...this.state.imgProps} />
    );
  },

  _setState: function (props) {
    var state = this.state;
    var imgProps = props;
    var keys = Object.keys(state);
    var len = keys.length;

    for (var i = 0; i < len; i++) {
      var key = keys[i];

      if (key in imgProps) {
        state[key] = imgProps[key];
        delete imgProps[key];
      }
    }

    state.imgProps = assign(state.imgProps, imgProps);

    this.setState(state);

    this.fetchImage(state.src, state.tabStatus, state.url);
  },

  fetchImage: function (url, tabStatus, guideUrl) {
    if ('loading' === tabStatus) {
      this.setState({ dataURL: 'loading' });
    } else {
      Api.getLinkBlanker().fetchImage(url, this._onFetch, guideUrl);
    }
  },

  _onFetch: function (error, dataURL) {
    // Logger.debug('onfetch => ', arguments, this);

    if (!error && dataURL) {
      this.setState({ dataURL: dataURL });
    } else {
      // Logger.debug('[faild] fetch image', error);
      this.setState({ dataURL: 'faild' });
    }
  },
});

module.exports = Image;
