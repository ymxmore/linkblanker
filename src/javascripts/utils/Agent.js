
/**
 * Export the constructor.
 */
module.exports = Agent;

/**
 * LinkBlanker agent active instance.
 */
var _this;

var React = require('react');

function Agent (window) {
  this.window = window;
  this.enable = false;
  this.multiClickClose = false;
  this.isBackground = false;
  this.shortcutKeyTobbleEnabled = false;
  this.ports = {};
  this.keys = [];

  initialize.apply(this);
}

function initialize () {
  _this = this;

  // extendEvent();

  chrome.extension.onMessage.addListener(function(response, sender) {
    if ('name' in response &&
        response.name in _this.receiveMessages &&
        'function' === typeof _this.receiveMessages[response.name]) {
      // call receiver
      _this.receiveMessages[response.name].apply(_this, [ response ]);
    }
  });

  _this.portInitialize('openTab', 'removeTabs', 'toggleEnabled');
  _this.bindEvents();
}

Agent.prototype.portInitialize = function() {
  var args = Array.prototype.slice.call(arguments);

  args.forEach(function (key) {
    var port = chrome.extension.connect({ name: key });

    delete _this.ports[key];

    port.onDisconnect.addListener(function() {
      _this.ports[key] = false;
    });

    _this.ports[key] = port;
  });
};

Agent.prototype.bindEvents = function() {
  for (var e in this.events) {
    this.window.removeEventListener(e, this.events[e]);
  }

  if (this.enabled) {
    this.window.addEventListener('click', this.events.click);
  }

  if (this.shortcutKeyTobbleEnabled.length > 0) {
    this.window.addEventListener('keydown', this.events.keydown);
    this.window.addEventListener('keyup', this.events.keyup);
  }
};

Agent.prototype.events = {
  click: function (e) {
    var target = getNode(e.target, 'a');

    if (target) {
      if (_this.ports.openTab &&
        target.href &&
        !target.onclick &&
        !target.href.match(/javascript:/i) &&
        !target.href.match(/#.*$/i) &&
        !e.defaultPrevented) {

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        var params = {
          url: _this.absPath(target.href),
          selected: !_this.isBackground
        };

        _this.ports.openTab.postMessage(params);

        return false;
      }
    } else if (_this.multiClickClose) {
      // multi clicks tab close.
      if (_this.ports.removeTabs && 3 === e.detail) {
        var align = (e.clientX > window.document.documentElement.clientWidth / 2) ? 'right' : 'left';

        _this.ports.removeTabs.postMessage({
          align:   align,
          clientX: e.clientX,
          clientY: e.clientY,
          pageX:   e.pageX,
          pageY:   e.pageY
        });

        _this.window.getSelection().collapse(document.body, 0);
      }
    }
  },
  keydown: function (e) {
    var keyCode = Number(e.keyCode);

    if (-1 === _this.keys.indexOf(keyCode)) {
      _this.keys.push(keyCode);
    }

    if (_this.keys.length === _this.shortcutKeyTobbleEnabled.length) {
      var exist = true;

      for (var i in _this.keys) {
        if (-1 === _this.shortcutKeyTobbleEnabled.indexOf(_this.keys[i])) {
          exist = false;
          break;
        }
      }

      if (exist) {
        _this.keys = [];
        _this.ports.toggleEnabled.postMessage();
      }
    }
  },
  keyup: function (e) {
     _this.keys = [];
  }
};

Agent.prototype.receiveMessages = {
  updateStatus: function (response) {
    if ('enabled' in response) {
      _this.enabled = Boolean(response.enabled);
    }

    if ('isBackground' in response) {
      _this.isBackground = Boolean(response.isBackground);
    }

    if ('multiClickClose' in response) {
      _this.multiClickClose = Boolean(response.multiClickClose);
    }

    if ('shortcutKeyTobbleEnabled' in response) {
      _this.shortcutKeyTobbleEnabled = response.shortcutKeyTobbleEnabled
        .split(',')
        .filter(function (val) {
          return val !== '';
        }).map(function (val) {
          return Number(val);
        });
    }

    _this.bindEvents();
  },

  norifyRemoveTabs: function (response) {
    // !! TODO
  }
};

Agent.prototype.absPath = function (path){
  var e = this.window.document.createElement('div');
  e.innerHTML = '<a href="' + path + '" />';
  return e.firstChild.href;
};

function getNode (target, tag, normalized) {
  if (!target || !tag) {
    return false;
  }

  if (!normalized) {
    tag = tag || '';
    tag = tag.toLowerCase();
  }

  if (tag === target.nodeName.toLowerCase()) {
    return target;
  } else if (target.parentNode) {
    return getNode(target.parentNode, tag, true);
  }

  return false;
}
