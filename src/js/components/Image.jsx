/**
 * components/Image.jsx
 */

var assign = require('object-assign');
var Logger = require('../utils/Logger');
var md5 = require('md5');
var React = require('react');
var request = require('superagent');

var Image = React.createClass({
  propTypes: {
    src: React.PropTypes.string.isRequired,
    useCache: React.PropTypes.bool,
  },

  getDefaultProps: function () {
    return {
      src: '',
      useCache: true,
    };
  },

  getInitialState: function () {
    return {
      src: '',
      dataURL: '',
      useCache: true,
      imgProps: {},
    };
  },

  componentWillMount: function () {
    Logger.debug('Image.componentWillReceiveProps > ', this.props);

    var state = this.state;
    var imgProps = this.props;
    var keys = Object.keys(state);
    var len = keys.length;

    Logger.debug('Image.componentWillReceiveProps loop > ', state, imgProps);

    for (var i = 0; i < len; i++) {
      var key = keys[i];

      if (key in imgProps) {
        state[key] = imgProps[key];
        delete imgProps[key];
      }
    }

    state.imgProps = assign(state.imgProps, imgProps);
    state.imgProps.className = (state.imgProps.className || '') + ' favicon';
    state.dataURL = this._getDataURL(state.src, state.useCache);

    this.setState(state);
  },

  render: function () {
    var className = (this.state.imgProps.className || '');

    switch (this.state.dataURL) {
      case 'loading':
        className += ' fa fa-2x fa-circle-o-notch fa-spin';
        return (<i className={className}></i>);
      case 'faild':
        className += ' fa fa-2x fa-sticky-note-o';
        return (<i className={className}></i>);
    }

    return (
      <img {...this.state.imgProps} src={this.state.dataURL}/>
    );
  },

  _getDataURL: function (url, useCache) {
    if (url && '' !== url) {
      var cacheKey = this._getCacheKey(url);

      if (useCache && cacheKey in sessionStorage) {
        return sessionStorage[cacheKey];
      }

      if (!url.match(/^https?:\/\/.+/)) {
        return 'faild';
      }

      var self = this;

      try {
        var xhr = new XMLHttpRequest();

        xhr.timeout = 10000;
        xhr.responseType = 'arraybuffer';

        xhr.open('GET', url, true);

        xhr.onload = function (e) {
          Logger.debug('onload.', e, this);

          if (200 !== this.status) {
            self.onerror.apply(this);
            return;
          }

          var bytes = new Uint8Array(this.response);
          var ext = self._getExtention(bytes);

          Logger.debug(ext, bytes);

          var raw = String.fromCharCode.apply(null, bytes);
          var b64 = btoa(raw);
          var dataURL = 'data:image/' + ext + ';base64,' + b64;

          // cache
          if (useCache) {
            sessionStorage[cacheKey] = dataURL;
          }

          // set
          self.setState({ dataURL: dataURL });
        };

        xhr.onreadystatechange = function (e) {
          Logger.debug('onreadystatechange.', e, this);

          if (this.readyState === 4) {
          }
        };

        xhr.onerror = xhr.ontimeout = xhr.ontimeout = function (e) {
          Logger.debug('fetch onerror.', e);

          if (useCache) {
            delete sessionStorage[cacheKey];
          }

          self.setState({ dataURL: 'faild' });
        };

        xhr.send();

        Logger.debug('image fetching.', url);

        return 'loading';
      } catch (e) {
        Logger.debug('fetch image faild.', e);
        return 'faild';
      }
    }

    Logger.debug('no url.', url);

    return 'faild';
  },

  _getCacheKey: function (url) {
    if (this.cacheKey) {
      return this.cacheKey;
    }

    var cacheKey = 'cache:' + md5(url);

    this.cacheKey = cacheKey;

    return this.cacheKey;
  },

  _getExtention: function (bytes) {
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length-2] === 0xff && bytes[bytes.length-1] === 0xd9) {
      return 'jpeg';
    } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return 'png';
    } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return 'gif';
    }

    return 'jpeg';
  },
});

module.exports = Image;
