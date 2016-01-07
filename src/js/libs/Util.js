/*
 * libs/Util.js
 */

import url from 'url';
import Logger from './Logger';

const PARSE_URL_CACHE_MAX = 50;
const _parseUrlCache = {};

export default class Util {

  static getParseUrlCache(key) {
    let cache = _parseUrlCache[key];
    return cache ? cache.value : false;
  }

  static setParseUrlCache(key, value) {
    let keys = Object.keys(_parseUrlCache);

    if (keys.length > PARSE_URL_CACHE_MAX) {
      let values = Util.objectValues(_parseUrlCache);

      values.sort((a, b) => {
        if (a.time < b.time) return -1;
        if (a.time > b.time) return 1;
        return 0;
      });

      let removeValues = values.splice(0, Math.floor(PARSE_URL_CACHE_MAX / 2));

      removeValues.forEach((value) => {
        delete _parseUrlCache[value.key];
      });
    }

    _parseUrlCache[key] = {
      key,
      value,
      time: new Date()
    };
  }

  static parseUrl(urlstr) {
    let cache = Util.getParseUrlCache(urlstr);

    if (cache) {
      return cache;
    }

    let parsed = url.parse(urlstr);

    Object.keys(parsed).forEach((key) => {
      if (!parsed[key]) {
        parsed[key] = '';
      }
    });

    // domain
    parsed.domain = parsed.host;

    let dirs = parsed.pathname
      .split('/')
      .filter((value) => value && '' !== value);

    let directory = '';

    if (dirs.length >= 2) {
      directory = `${parsed.protocol}//${parsed.auth}${'' !== parsed.auth ? '@' : ''}${parsed.host}/${dirs.splice(0, dirs.length - 1).join('/')}`;
    }

    // directory
    parsed.directory = directory;

    // url
    parsed.url = parsed.href;

    Util.setParseUrlCache(urlstr, parsed);

    return parsed;
  }

  static objectValues(obj) {
    if (!obj) {
      return [];
    }

    return Object.keys(obj).map((k) => obj[k]);
  }

  static isArray(obj) {
    return '[object Array]' === Object.prototype.toString.call(obj);
  }
}
