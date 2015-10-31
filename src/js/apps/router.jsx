/**
 * apps/router.jsx
 */

if (__NODE_ENV__ !== 'production') {
  console.info('[router] environment: %c' + __NODE_ENV__, 'color: #00c9b6');
  console.info('[router] version: %c' + __API_VERSION__, 'color: #00c9b6');
  console.info('[router] build date at: %c' + __BUILD_DATE_AT__, 'color: #00c9b6');
}

var NotFound = require('../components/NotFound.jsx');
var App = require('../components/App.jsx');
var Popup = require('../components/Popup.jsx');
var Preference = require('../components/Preference.jsx');
var React = require('react');
var ReactDOM = require('react-dom');
var ReactRouter = require('react-router');
var Tree = require('../components/Tree.jsx');
var InjectTapEventPlugin = require('react-tap-event-plugin');

var IndexRoute = ReactRouter.IndexRoute;
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;

// Needed for onTouchTap
// Can go away when react 1.0 release
// Check this repo:
// https://github.com/zilverline/react-tap-event-plugin
InjectTapEventPlugin();

ReactDOM.render(
  (
    <Router>
      <Route path="/" component={App}>
        <Route path="preference" component={Preference}/>
        <Route path="tree" component={Tree}/>
        <Route path="popup" component={Popup}/>
        <IndexRoute component={Tree}/>
        <Route path="*" component={NotFound}/>
      </Route>
    </Router>
  ),
  document.getElementById('root')
);
