/**
 * utils/Storage.js
 */

var assign = require('object-assign');
var LinkBlankerConstants = require('../constants/LinkBlanker');
var StorageType = LinkBlankerConstants.StorageType;

var _instance = {};

var StorageFactory = {

  get: function (type) {
    if (type in _instance) {
      return _instance[type];
    }

    switch (type) {
      case StorageType.PERSISTENCE:
        _instance[type] = new LocalStorage();
        break;
      case StorageType.EPHEMERAL:
        _instance[type] = new SessionStorage();
        break;
      default:
        throw new Error('Specified instance is not supported [' + type + ']');
    }

    return _instance[type];
  },
};

function Storage () {}

Storage.prototype = assign({}, Storage.prototype, {
  unserialize: function (value) {
    if ('string' === typeof value) {
      if (value.match(/^[0-9]+$/)){
        return Number(value);
      }

      if (value.match(/^[\[{]{1}.*[\]}]{1}$/)){
        return JSON.parse(value);
      }
    }

    return value;
  },

  serialize: function (value) {
    if ('object' === typeof value) {
      return JSON.stringify(value);
    }

    return value.toString();
  },

  size: function (key) {},
  getItem: function (key, defaultValue) {},
  setItem: function (key, value) {},
  removeItem: function (key) {},
  clear: function () {},
  exist: function (key) {},
});

function LocalStorage () {}

LocalStorage.prototype = assign({}, Storage.prototype, LocalStorage.prototype, {
  size: function (key) {
    return localStorage.length;
  },
  getItem: function (key, defaultValue) {
    if (this.exist(key)) {
      return this.unserialize(localStorage.getItem(key));
    }

    return defaultValue;
  },
  setItem: function (key, value) {
    return localStorage.setItem(key, this.serialize(value));
  },
  removeItem: function (key) {
    return localStorage.removeItem(key);
  },
  clear: function () {
    return localStorage.clear();
  },
  exist: function (key) {
    return (key in localStorage);
  },
});

function SessionStorage () {}

SessionStorage.prototype = assign({}, Storage.prototype, SessionStorage.prototype, {
  size: function (key) {
    return sessionStorage.length;
  },
  getItem: function (key, defaultValue) {
    if (this.exist(key)) {
      return this.unserialize(sessionStorage.getItem(key));
    }

    return defaultValue;
  },
  setItem: function (key, value) {
    return sessionStorage.setItem(key, this.serialize(value));
  },
  removeItem: function (key) {
    return sessionStorage.removeItem(key);
  },
  clear: function () {
    return sessionStorage.clear();
  },
  exist: function (key) {
    return (key in sessionStorage);
  },
});

module.exports = StorageFactory;
