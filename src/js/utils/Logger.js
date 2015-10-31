/**
 * utils/Logger.js
 */

var Logger = {
  debug: (function () {
    if (__NODE_ENV__ !== 'production') {
      return console.log.bind(console);
    }

    return function (){};
  })(),

  info: console.info.bind(console),

  warn: console.warn.bind(console),

  error: console.error.bind(console),
};

module.exports = Logger;
