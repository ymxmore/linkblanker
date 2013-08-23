;(function($){
	var enable,
		multiClickClose,
		isBackground,
		ports = {},
		overlayHtml = '<div id="linkblanker-overlay"></div>',
		closeActionHtml = '<div class="linkblanker-close-action"><div class="linkblanker-message">{REMOVE_TAB_ALIGN}側の{REMOVE_TAB_LENGTH}コのタブを<br />落としました。<p class="linkblanker-from">By Link Blanker</p></div></div>';

	var initialize = function() {
		postInitialize("openTab");
		postInitialize("removeTabs");
		setInterval(bindEvent, 100);
	};

	var postInitialize = function(key) {
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

		$(closeActionHtml.replace("{REMOVE_TAB_ALIGN}", message.align === "left" ? "左" : "右").replace("{REMOVE_TAB_LENGTH}", message.removeTabsLength)).css({
			top:  top + "px",
			left: left + "px",
			"background-image": "url('" + chrome.extension.getURL('/images/close-action.png') + "')"
		}).appendTo($("body"));

		setTimeout(function() {
			$(".linkblanker-close-action").remove();
		}, 1100);
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
			} else if (response.name === "norifyRemoveTabs") {
				norifyRemoveTabs(response);
			}
		}
	});

	var bindEvent = function() {
		if (enable) {
			$("a").off("click", anchorClick).on("click", anchorClick);
		} else {
			$("a").off("click", anchorClick);
		}

		if (multiClickClose) {
			$(window).off("click", windowClick).on("click", windowClick);
		} else {
			$(window).off("click", windowClick);
		}
	};

	var windowClick = function(e) {
		console.log(e);
		var originalEvent = e.originalEvent;

		if (ports.removeTabs && originalEvent.target.nodeName.toLowerCase() !== "a" && originalEvent.detail == 3) {
			var align = (e.clientX > document.documentElement.clientWidth / 2) ? "right" : "left";
			ports.removeTabs.postMessage({ align: align, clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY });

			var selection = window.getSelection();
			selection.collapse(document.body, 0);
		}
	};

	var anchorClick = function(e) {
		if (ports.openTab && this.href && !this.onclick && !this.href.match(/javascript:/i) && !this.href.match(/#.*$/i)) {
			e.preventDefault();
			e.stopPropagation();

			var params = {
				url: absPath(this.href),
				selected: isBackground == 1 ? false : true
			};

			ports.openTab.postMessage(params);

			return false;
		}
	};

	var absPath = function(path){
	    var e = document.createElement('div');
	    e.innerHTML = '<a href="' + path + '" />';
	    return e.firstChild.href;
	};

	initialize();
})(jQuery);
