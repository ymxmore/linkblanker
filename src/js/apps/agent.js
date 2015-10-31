/**
 * apps/agent.js
 */

if (__NODE_ENV__ !== 'production') {
  console.info('[agent] environment: %c' + __NODE_ENV__, 'color: #00c9b6');
  console.info('[agent] version: %c' + __API_VERSION__, 'color: #00c9b6');
  console.info('[agent] build date at: %c' + __BUILD_DATE_AT__, 'color: #00c9b6');
}

var Agent = require('../utils/Agent');

/**
 * LinkBlanker Agent
 */
window.LinkBlankerAgent = new Agent(window);
