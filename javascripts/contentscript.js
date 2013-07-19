;(function($){
	var enable,
		isOn,
		port = chrome.extension.connect({ name: "removeTabs" }),
		overlayHtml = '<div id="linkblanker-overlay"></div>',
		closeActionHtml = '<div class="linkblanker-close-action"><div class="linkblanker-message">{REMOVE_TAB_ALIGN}側の{REMOVE_TAB_LENGTH}コのタブを<br />落としました。<p class="linkblanker-from">By Link Blanker</p></div></div>';

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

	setInterval(function() {
		if (enable) {			
			$("a").filter(function() {
				return !this.target && !this.onclick && !this.href.match(/javascript:void/i) && !this.href.match(/#.*$/i);
			}).attr({'target': '_blank', 'data-linkblanker': 'enable'});			
		} else {
			$('a[data-linkblanker="enable"]').removeAttr('target data-linkblanker');
		}
	}, 200);

	chrome.extension.onMessage.addListener(function(response, sender) {
		if ("name" in response) {
			if (response.name === "updateStatus") {
				if ("enable" in response) {
					enable = response.enable;
				}

				if ("multiClickClose" in response && response.multiClickClose) {
					if (!isOn) {
						isOn = true;
						$(window).on("click", windowClick);
					}
				} else {
					isOn = false;
					$(window).off("click", windowClick);
				}
			} else if (response.name === "norifyRemoveTabs") {
				norifyRemoveTabs(response);
			}
		}
	});

	var windowClick = function(e) {
		var originalEvent = e.originalEvent;

		if (originalEvent.target.nodeName !== "A" && originalEvent.detail == 3) {
			var align = (e.clientX > document.documentElement.clientWidth / 2) ? "right" : "left";
			port.postMessage({ align: align, clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY });
			
			var selection = window.getSelection();
			selection.collapse(document.body, 0);
		}
	};
})(jQuery);