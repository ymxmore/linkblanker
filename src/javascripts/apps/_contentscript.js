;(function($){
  var methods = {
    window: {
      on: function(){
        return this.each(function(i, val) {
          $(val).linkblanker("window.off").on("click", windowClick);
        });
      },
      off: function(){
        return this.each(function(i, val) {
          $(val).off("click", windowClick);
        });
      },
    },
    anchor: {
      on: function(){
        return this.each(function(i, val) {
          $(val).linkblanker("anchor.off").on("click", "a", anchorClick);
        });
      },
      off: function(){
        return this.each(function(i, val) {
          $(val).off("click", "a", anchorClick);
        });
      }
    },
    keydown: {
      on: function() {
        return this.each(function(i, val) {
          $(val).linkblanker("keydown.off").on("keydown", keydown);
        });
      },
      off: function() {
        return this.each(function(i, val) {
          $(val).off("keydown", keydown);
        });
      }
    },
    keyup: {
      on: function() {
        return this.each(function(i, val) {
          $(val).linkblanker("keyup.off").on("keyup", keyup);
        });
      },
      off: function() {
        return this.each(function(i, val) {
          $(val).off("keyup", keyup);
        });
      }
    }
  };

  $.fn.linkblanker = function(method) {
    var _method = null;

    $.each(method.split("."), function(i, val) {
      if (_method && _method[val]) {
        _method = _method[val];
      } else if (methods[val]) {
        _method = $.extend(true, {}, methods)[val];
      }
    });

    if (_method) {
      return _method.apply( this, Array.prototype.slice.call( arguments, 1 ));
    }

    return this;
  };

  chrome.extension.onMessage.addListener(function(response, sender) {
    if ("name" in response) {
      if (response.name === "updateStatus") {
        if ("enable" in response && response.enable) {
          if (!enable) {
            enable = true;
          }
        } else {
          enable = false;
        }

        isBackground = ("isBackground" in response) ? response.isBackground : 0;

        if ("multiClickClose" in response && response.multiClickClose) {
          if (!multiClickClose) {
            multiClickClose = true;
          }
        } else {
          multiClickClose = false;
        }

        shortcutKeyTobbleEnabled = $.grep(response.shortcutKeyTobbleEnabled.split(','), grepBlank);
        shortcutKeyTobbleEnabled = $.map(shortcutKeyTobbleEnabled, mapNumber);

        bindEvent();
      } else if (response.name === "norifyRemoveTabs") {
        norifyRemoveTabs(response);
      }
    }
  });

  var enable,
    multiClickClose,
    isBackground,
    shortcutKeyTobbleEnabled,
    ports = {},
    overlayHtml = '<div id="linkblanker-overlay"></div>',
    closeActionHtml = '<div class="linkblanker-close-action"><div class="linkblanker-message">' + chrome.i18n.getMessage("message_drop_tabs") + '<p class="linkblanker-from">By Link Blanker</p></div></div>';

  var initialize = function() {
    portInitialize("openTab");
    portInitialize("removeTabs");
    portInitialize("toggleEnabled");
    bindEvent();
  };

  var portInitialize = function(key) {
    port = chrome.extension.connect({ name: key });

    delete ports[key];
    port.onDisconnect.addListener(function() {
      ports[key] = false;
    });
    ports[key] = port;
  };

  var norifyRemoveTabs = function(message) {
    var halfWidth = Math.floor(document.documentElement.clientWidth / 2),
      top = Math.floor(message.pageY) - 250,
      left = Math.floor(message.pageX) - 250,
      scrollTop = window.scrollY,
      scrollLeft = window.scrollX;

    var viewport = {
      top: scrollTop,
      right: scrollLeft + document.documentElement.clientWidth,
      bottom: scrollTop + document.documentElement.clientHeight,
      left: scrollLeft
    };

    if (top < viewport.top) {
      top = viewport.top;
    } else if (top + 500 > viewport.bottom) {
      top = viewport.bottom - 500;
    }

    if (left < viewport.left) {
      left = viewport.left;
    } else if (left + 500 > viewport.right) {
      left = viewport.right - 500;
    }

    setTimeout(function() {
      $(closeActionHtml.replace("{REMOVE_TAB_ALIGN}", message.align === "left" ? chrome.i18n.getMessage("title_left") : chrome.i18n.getMessage("title_right")).replace("{REMOVE_TAB_LENGTH}", message.removeTabsLength)).css({
        top:  top + "px",
        left: left + "px",
        "background-image": "url('" + chrome.extension.getURL('/dest/images/close-action.png') + "')"
      }).appendTo($("body"));

      setTimeout(function() {
        $(".linkblanker-close-action").remove();
      }, 1200);
    }, (80 * message.removeTabsLength));
  };

  var bindEvent = function() {
    var target = $('iframe').map(function() {
      return $(this.contentWindow.document);
    }).add($(document));

    target.linkblanker("anchor." + (enable ? 'on' : 'off'));

    $(window)
      .linkblanker("window."  + (multiClickClose ? 'on' : 'off'))
      .linkblanker("keydown." + ((shortcutKeyTobbleEnabled && shortcutKeyTobbleEnabled.length > 0) ? 'on' : 'off'))
      .linkblanker("keyup."   + ((shortcutKeyTobbleEnabled && shortcutKeyTobbleEnabled.length > 0) ? 'on' : 'off'));
  };

  var windowClick = function(e) {
    var originalEvent = e.originalEvent;

    if (ports.removeTabs && originalEvent.target.nodeName.toLowerCase() !== "a" && originalEvent.detail == 3) {
      var align = (e.clientX > document.documentElement.clientWidth / 2) ? "right" : "left";
      ports.removeTabs.postMessage({ align: align, clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY });

      var selection = window.getSelection();
      selection.collapse(document.body, 0);
    }
  };

  var anchorClick = function(e) {
    if (ports.openTab && this.href && !this.onclick && !this.href.match(/javascript:/i) && !this.href.match(/#.*$/i) && !e.isDefaultPrevented() && !e.isPropagationStopped() && !e.isImmediatePropagationStopped()) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      var params = {
        url: absPath(this.href),
        selected: isBackground == 1 ? false : true
      };

      ports.openTab.postMessage(params);

      return false;
    }
  };

  var keydown = function(e) {
    var self = $(this);
    var keydown = (self.data("linkblanker-keydown") || "").split(',');

    keydown = $.grep(keydown, grepBlank);
    keydown = $.map(keydown, mapNumber);
    keydown.push(e.keyCode);

    if (keydown.length === shortcutKeyTobbleEnabled.length) {
      keydown.sort();
      shortcutKeyTobbleEnabled.sort();

      var match = true;

      for (var i = 0; i < keydown.length; i++) {
        if (keydown[i] != shortcutKeyTobbleEnabled[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        ports.toggleEnabled.postMessage();
      }
    }

    self.data("linkblanker-keydown", keydown.join(','));
  };

  var keyup = function(e) {
    var self = $(this);
    self.data("linkblanker-keydown", "");
  };

  var grepBlank = function(val) {return val !== "";};

  var mapNumber = function(val) {return Number(val);};

  var absPath = function(path){
      var e = document.createElement('div');
      e.innerHTML = '<a href="' + path + '" />';
      return e.firstChild.href;
  };

  initialize();
})(jQuery);
