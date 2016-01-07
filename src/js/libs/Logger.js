/*
 * libs/Logger.js
 */

const cli = window.console;

const Logger = {
  debug: (() => {
    if (__NODE_ENV__ !== 'production') {
      return cli.log.bind(cli, '[debug]:');
    }

    return () => {};
  })(),

  info: cli.info.bind(cli, '[info]:'),

  warn: cli.warn.bind(cli, '[warn]:'),

  error: cli.error.bind(cli, '[error]:')
};

module.exports = Logger;
