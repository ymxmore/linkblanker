/**
 * apps/linkblanker.js
 */

if (__NODE_ENV__ !== 'production') {
  console.info('[linkblanker] environment: %c' + __NODE_ENV__, 'color: #00c9b6');
  console.info('[linkblanker] version: %c' + __API_VERSION__, 'color: #00c9b6');
  console.info('[linkblanker] build date at: %c' + __BUILD_DATE_AT__, 'color: #00c9b6');
}

var LinkBlanker = require('../utils/LinkBlanker');

/**
 * LinkBlanker
 */
window.LinkBlanker = new LinkBlanker(chrome);
