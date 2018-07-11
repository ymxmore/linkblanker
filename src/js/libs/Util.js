/*
 * libs/Util.js
 */

import url from 'url';

const PARSE_URL_CACHE_MAX = 50;
const _parseUrlCache = {};

/**
 * Util
 *
 * @class
 * @classdesc ユーティリティクラス
 */
export default class Util {
  /**
   * URLの解析結果をキャッシュから取得
   *
   * @param {string} key URL
   * @return {Object|boolean} URL解析結果
   */
  static getParseUrlCache(key) {
    const cache = _parseUrlCache[key];
    return cache ? cache.value : false;
  }

  /**
   * URLの解析結果をキャッシュ
   *
   * @param {string} key キー
   * @param {object} value URL解析結果
   */
  static setParseUrlCache(key, value) {
    const keys = Object.keys(_parseUrlCache);

    if (keys.length > PARSE_URL_CACHE_MAX) {
      const values = Util.objectValues(_parseUrlCache);

      values.sort((a, b) => {
        if (a.time < b.time) return -1;
        if (a.time > b.time) return 1;
        return 0;
      });

      const removeValues = values.splice(
        0,
        Math.floor(PARSE_URL_CACHE_MAX / 2)
      );

      removeValues.forEach((value) => {
        delete _parseUrlCache[value.key];
      });
    }

    _parseUrlCache[key] = {
      key,
      value,
      time: new Date(),
    };
  }

  /**
   * URLを解析
   *
   * @param {string} urlStr URL
   * @return {object} URL解析結果
   */
  static parseUrl(urlStr) {
    const cache = Util.getParseUrlCache(urlStr);

    if (cache) {
      return cache;
    }

    const parsed = url.parse(urlStr);

    Object.keys(parsed).forEach((key) => {
      if (!parsed[key]) {
        parsed[key] = '';
      }
    });

    // domain
    parsed.domain = parsed.host;

    const dirs = parsed.pathname
      .split('/')
      .filter((value) => value && value !== '');

    let directory = '';

    if (dirs.length >= 2) {
      directory = `${parsed.protocol}//${parsed.auth}${parsed.auth !== '' ? '@' : ''}${parsed.host}/${dirs.splice(0, dirs.length - 1).join('/')}`;
    }

    // directory
    parsed.directory = directory;

    // url
    parsed.url = parsed.href;

    Util.setParseUrlCache(urlStr, parsed);

    return parsed;
  }

  /**
   * 指定されたオブジェクトの値の配列を返却
   *
   * @param {object} obj 対象オブジェクト
   * @return {Array} オブジェクトの値の配列
   */
  static objectValues(obj) {
    if (!obj) {
      return [];
    }

    return Object.keys(obj).map((k) => obj[k]);
  }

  /**
   * 指定された引数が配列かどうか
   *
   * @param {*} obj 検証対象
   * @return {boolean} 配列の場合: true
   */
  static isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  /**
   * 全てのコンテキストを変更
   *
   * @param {object} obj オブジェクト
   * @param {object} context コンテキスト
   * @return {object} 配列の場合: true
   */
  static bindAll(obj, context) {
    const result = {};

    Object.keys(obj).forEach((key) => {
      result[key] = obj[key].bind(context);
    });

    return result;
  }
}
