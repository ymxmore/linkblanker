;(function($){
	var linkblanker = chrome.extension.getBackgroundPage().linkblanker;

	var initialize = function() {
		renderHtml();
	};

	var renderHtml = function() {
		var html = [];
		
		html.push('<div id="wrapper">')
		html.push('<h1 id="extension-name">Link Blanker</h1>');
		html.push('<h2 class="preference-header">全体設定</h2>');
		html.push('<ul class="preference-list">');
		html.push('<li><label><input id="disabled-extension" type="checkbox" />一時停止</label></li>');
		html.push('</ul>');

		html.push('<h2 class="preference-header">ページ別設定</h2>');
		html.push('<ul class="preference-list">');
		html.push('<li><label><input id="disabled-domain" type="checkbox" />このドメインでは同一タブで開く</label></li>');
		html.push('<li><label><input id="disabled-page" type="checkbox" />このページでは同一タブで開く</label></li>');
		html.push('</ul>');
		html.push('</div>');

		$("body").append(html.join(""));

		setInitialData();

		$("input[type=checkbox]").change(checkboxOnChange);
	};

	var setInitialData = function() {
		$("input[type=checkbox]").each(function() {
			var self = $(this);
			var id  = $(this).attr("id");

			self.removeAttr("checked");

			if (localStorage[id]) {
				if (id === "disabled-extension") {
					if (localStorage[id] == 1) {
						self.attr("checked", "checked");
					}
				} else {
					linkblanker.currentData(function(result) {
						var data = linkblanker.getData();

						if (data[id].indexOf(result[(id === "disabled-domain" ? "domain" : "url")]) > -1) {
							self.attr("checked", "checked");
						} 
					});
				}
			}
		});
	};

	var checkboxOnChange = function() {
		var self = $(this);
		var id  = self.attr("id");
		var checked = self.is(":checked");

		if (id === "disabled-extension") {
			localStorage[id] = checked ? 1 : 0;
		} else {
			linkblanker.currentData(function(result) {
				var data = linkblanker.getData();
				var val = result[(id === "disabled-domain" ? "domain" : "url")];

				if (checked) {
					data[id].push(val);
				} else {
					var index = data[id].indexOf(val);

					if (index > -1) {
						data[id].splice(index, 1);
					}					
				}
				
				localStorage[id] = JSON.stringify(data[id]);
			});
		}

		notifyAllTabs();
	};

	var notifyAllTabs = function() {
		chrome.tabs.getAllInWindow(null, function(tabs) {
			for (var i = 0; i < tabs.length; i++) {
				linkblanker.updateStatus(tabs[i]);
			}
		});
	};

	$(document).ready(function() {
		initialize();
	});
})(jQuery);