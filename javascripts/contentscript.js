;(function($){
	var enable,
		isOn,
		port = chrome.extension.connect({ name: "removeTabs" });

	setInterval(function() {
		if (enable) {			
			$("a").filter(function() {
				return !this.target && !this.onclick && !this.href.match(/javascript:void/i) && !this.href.match(/#.*$/i);
			}).attr({'target': '_blank', 'data-linkblanker': 'enable'});			
		} else {
			$('a[data-linkblanker="enable"]').removeAttr('target data-linkblanker');
		}
	}, 200);

	chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
		if ("enable" in request) {
			enable = request.enable;
		}

		if ("multiClickClose" in request && request.multiClickClose) {
			if (!isOn) {
				isOn = true;
				$(window).on("click", windowClick);
			}
		} else {
			isOn = false;
			$(window).off("click", windowClick);
		}

		sendResponse(true);
	});

	var windowClick = function(e) {
		var originalEvent = e.originalEvent;

		if(originalEvent.target.nodeName !== "A" && originalEvent.detail == 3) {
			var align = (e.clientX > document.documentElement.clientWidth / 2) ? "right" : "left";
			port.postMessage({ align: align });
			
			var selection = window.getSelection();
			selection.collapse(document.body, 0);
		}
	};
})(jQuery);