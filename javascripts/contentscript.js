;(function($){
	var enable;

	setInterval(function() {
		if (enable) {			
			$("a").filter(function() {
				return !this.target && !this.onclick && !this.href.match(/javascript:void/i) && !this.href.match(/#.*$/i);
			}).attr({'target': '_blank', 'data-linkblanker': 'enable'});			
		} else {
			$('a[data-linkblanker="enable"]').removeAttr('target data-linkblanker');
		}
	}, 200);

	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
		if ("enable" in request) {
			enable = Number(request.enable);
		}

		sendResponse(true);
	});
})(jQuery);