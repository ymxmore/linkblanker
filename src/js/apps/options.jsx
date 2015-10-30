/*
 * options.jsx
 */

var NotFound = require('../components/NotFound.jsx');
var Options = require('../components/Options.jsx');
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
      <Route path="/" component={Options}>
        <Route path="preference" component={Preference}/>
        <Route path="tree" component={Tree}/>
        <IndexRoute component={Tree}/>
        <Route path="*" component={NotFound}/>
      </Route>
    </Router>
  ),
  document.getElementById('options')
);
