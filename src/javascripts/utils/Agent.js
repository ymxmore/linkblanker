/**
 * Export the constructor.
 */
module.exports = Agent;

/**
 * LinkBlanker agent active instance.
 */
var _this;

var Tabs = require('./Tabs');

function Agent (window) {
  this.window = window;
  this.parse = {};
  this.enable = false;
  this.multiClickClose = false;
  this.isBackground = false;
  this.shortcutKeyTobbleEnabled = false;
  this.disabledSameDomain = false;
  this.ports = {};
  this.keys = [];

  initialize.apply(this);
}

function initialize () {
  _this = this;

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

  if (this.enabled || this.multiClickClose) {
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
      if (_this.enabled &&
        !e.defaultPrevented &&
        _this.ports.openTab &&
        target.href &&
        !target.onclick &&
        !target.href.match(/javascript:/i) &&
        !target.href.match(/#.*$/i)) {

        var targetFullUrl = _this.absPath(target.href);

        if (_this.disabledSameDomain &&
          targetFullUrl.match(new RegExp('^https?:\/\/' + _this.parse.domain))) {
          return true;
        }

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        var params = {
          url: targetFullUrl,
          selected: !_this.isBackground
        };

        _this.ports.openTab.postMessage(params);

        return false;
      }
    } else if (_this.multiClickClose) {
      // multi clicks tab close.
      if (_this.ports.removeTabs && 3 === e.detail) {
        var align = (e.clientX > _this.window.document.documentElement.clientWidth / 2) ? 'right' : 'left';

        _this.ports.removeTabs.postMessage({
          align:   align,
          clientX: e.clientX,
          clientY: e.clientY,
          pageX:   e.pageX,
          pageY:   e.pageY
        });

        _this.window.getSelection().collapse(_this.window.document.body, 0);
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
    if ('parse' in response) {
      _this.parse = response.parse;
    }

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

    if ('disabledSameDomain' in response) {
      _this.disabledSameDomain = Boolean(response.disabledSameDomain);
    }

    _this.bindEvents();
  },

  norifyRemoveTabs: function (response) {
    var _document = _this.window.document;
    var canvas = _this.getCanvas(response);

    _this.window.document.body.appendChild(canvas);

    var tabs = new Tabs(canvas);
    var align = 'left' === response.align ? tabs.REMOVE.RIGHT_TO_LEFT : tabs.REMOVE.LEFT_TO_RIGHT;

    tabs.show(response.removeTabsLength);

    setTimeout(function () {
      tabs.removeAll(align, function (removed) {
        canvas.setAttribute('class', 'hide');

        var notify = _this.getNotify(response, removed);
        _this.window.document.body.appendChild(notify);
        notify.show();

        setTimeout(function () {
          if (notify) {
            notify.hide();
          }
        }, 2000);

        setTimeout(function () {
          canvas.parentNode.removeChild(canvas);
        }, 210);
      });
    }, _this.getWait(response));
  }
};

Agent.prototype.getCanvas = function (info) {
  var canvas = _this.window.document.createElement('canvas');
  var meta = _this.getCloseActionMetaInfo(info);

  var styles = [
    'top:' + meta.top + 'px',
    'left:' + meta.left + 'px',
    'border-radius:' + Math.floor(meta.width / 2) + 'px'
  ];

  canvas.setAttribute('id', 'linkblanker-canvas');
  canvas.setAttribute('class', 'show');
  canvas.setAttribute('width', meta.width);
  canvas.setAttribute('height', meta.height);
  canvas.setAttribute('style', styles.join(';') + ';');

  return canvas;
};

Agent.prototype.getWait = function (info) {
  var wait = (50 * info.removeTabsLength);

  if (wait < 300) {
    wait = 300;
  } else if (wait > 1000) {
    wait = 500;
  }

  return wait;
};

Agent.prototype.getCloseActionMetaInfo = function (info) {
  var width = 300;
  var height = 300;
  var top = Math.floor(info.pageY) - Math.floor(height / 2);
  var left = Math.floor(info.pageX) - Math.floor(width / 2);
  var scrollTop = window.scrollY;
  var scrollLeft = window.scrollX;

  var viewport = {
    top: scrollTop,
    right: scrollLeft + _this.window.document.documentElement.clientWidth,
    bottom: scrollTop + _this.window.document.documentElement.clientHeight,
    left: scrollLeft
  };

  if (top < viewport.top) {
    top = viewport.top;
  } else if (top + height > viewport.bottom) {
    top = viewport.bottom - height;
  }

  if (left < viewport.left) {
    left = viewport.left;
  } else if (left + width > viewport.right) {
    left = viewport.right - width;
  }

  return {
    width: width,
    height: height,
    top: top,
    left: left,
  };
};

Agent.prototype.getNotify = function (info, length){
  var notify = _this.window.document.createElement('div');
  var div = _this.window.document.createElement('div');

  div.innerHTML = '<p>' + chrome.i18n.getMessage('message_drop_tabs')
    .replace(
      "{REMOVE_TAB_ALIGN}",
      'left' === info.align ?
        chrome.i18n.getMessage('title_left') :
        chrome.i18n.getMessage('title_right')
    )
    .replace("{REMOVE_TAB_LENGTH}", info.removeTabsLength) + '</p>';

  notify.appendChild(div);

  notify.setAttribute('id', 'linkblanker-notify');
  notify.setAttribute('style', "background-image:url('" + chrome.extension.getURL('dest/images/icon48.png') + "');");

  notify.show = function () {
    notify.setAttribute('class', 'show');
  };

  notify.hide = function () {
    if (notify) {
      notify.removeEventListener('mouseover', notify.hide);
      notify.setAttribute('class', 'hide');

      setTimeout(function () {
        if (notify) {
          notify.parentNode.removeChild(notify);
        }
      }, 1000);
    }
  };

  notify.addEventListener('mouseover', notify.hide);

  return notify;
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
