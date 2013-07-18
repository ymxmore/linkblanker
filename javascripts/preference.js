;(function($){
	var options = [
		{ id: "disabled-extension", group: 0, control: "checkbox", label: "一時停止" },
		{ id: "disabled-none",      group: 1, control: "radio",    value: 0, label: "有効&nbsp;(別タブで開きます)" },
		{ id: "disabled-domain",    group: 1, control: "radio",    value: 1, label: "現在表示中のドメインでは無効にする" },
		{ id: "disabled-directory", group: 1, control: "radio",    value: 2, label: "現在表示中のディレクトリ以下では無効にする" },
		{ id: "disabled-page",      group: 1, control: "radio",    value: 3, label: "現在表示中のページでは無効にする" }
	];

	var linkblanker = chrome.extension.getBackgroundPage().linkblanker;

	var isToggleControls = true;

	var initializedCount = 0;

	var initialize = function() {
		renderHtml();
	};

	var renderHtml = function() {
		var html = [
			'<div id="wrapper">',
			'<div id="extension-name"></div>',
			'<h2 class="preference-header">全体設定</h2>',
			'<ul class="preference-list">',
			getListHtml(0),
			'</ul>',
			'<h2 class="preference-header">個別設定</h2>',
			'<ul class="preference-list">'
		];

		for (var i = 1; i < options.length; i++) {
			html.push(getListHtml(i));
		};

		html.push('</ul></div>');

		$("body").append(html.join(""));

		$("input[type=checkbox], input[type=radio]").change(checkboxOnChange);

		setInitialData();
	};

	var getListHtml = function(optionsIndex) {
		if (options[optionsIndex].control === "checkbox") {
			return [
				'<li><label data-group="',
				options[optionsIndex].group,
				'"><input id="',
				options[optionsIndex].id,
				'" type="checkbox" data-group="',
				options[optionsIndex].group,
				'" name="',
				options[optionsIndex].id,
				'" /><span>',
				options[optionsIndex].label,
				'</span></label></li>'
			].join("");
		} else {
			return [
				'<li><label data-group="',
				options[optionsIndex].group,
				'" data-value="',
				options[optionsIndex].value,
				'"><input id="',
				options[optionsIndex].id,
				'" type="radio" data-group="',
				options[optionsIndex].group,
				'" name="radio-',
				options[optionsIndex].group,
				'" value="',
				options[optionsIndex].value,
				'"/><span>',
				options[optionsIndex].label,
				'</span></label></li>'
			].join("");
		}		
	};

	var setInitialData = function() {
		$(options.map(function(x) {
			return "#" + x.id
		}).join(",")).each(function(index, val) {
			var self = $(this),
				id   = $(this).attr("id");

			self.removeAttr("checked");

			if (localStorage[id]) {
				if (id === "disabled-extension") {
					if (localStorage[id] == 1) {
						self.attr("checked", "checked");
					}

					initializedCount++;
				} else {
					linkblanker.currentData(function(result) {
						var val  = preferenceValueFromId(id, result), 
							data = linkblanker.getData();

						if (id === "disabled-directory") {
							for (var i = 0; i < data[id].length; i++) {				
								if (val.match(new RegExp("^" + data[id][i] + ".*$"))) {
									self.attr("checked", "checked");
									break;
								}
							}
						} else {
							if (data[id].indexOf(val) > -1) {
								self.attr("checked", "checked");
							} 
						}

						initializedCount++;

						if (initializedCount == options.length - 1) {
							toggleControls();
						}
					});
				}
			}
		});
	};

	var checkboxOnChange = function() {
		var self = $(this),
			id  = this.id,
			checked = self.is(":checked");

		if (id === "disabled-extension") {
			localStorage[id] = checked ? 1 : 0;
		} else if (id !== "disabled-none") {
			linkblanker.currentData(function(result) {
				var val   = preferenceValueFromId(id, result), 
					data  = linkblanker.getData(),
					index = data[id].indexOf(val);

				if (checked) {
					if (index == -1) {
						data[id].push(val);
					}
				} else {
					if (index > -1) {
						data[id].splice(index, 1);
					}					
				}
				
				localStorage[id] = JSON.stringify(data[id]);
			});
		}

		if (isToggleControls) {
			toggleControls();
			notifyAllTabs();
		}
	};

	var toggleControls = function() {
		isToggleControls = false;

		var disable = false,
			disableGroup = -1;

		if ($('input[data-group="1"]:checked').size() === 0) {
			$('input[data-group="1"]:eq(0)').attr("checked", "checked");
		}

		var groups = $.unique(options.map(function(x) {
			return x.group;
		}));

		for (var i = 0; i < groups.length; i++) {
			$('input[data-group="' + groups[i] + '"]').each(function(j, val) {
				var self = $(this);

				switch (groups[i]) {
				case 0:
					if (self.is(":checked")) {
						$('[data-group="1"]').attr("disabled", "disabled");
					} else {
						$('[data-group="1"]').removeAttr("disabled");
					}
					break;
				}

				if (self.is(":checked")) {
					self.parents("label").addClass("checked");
				} else {
					self.parents("label").removeClass("checked");
				}
			});
		}

		$('input[data-group="1"]').each(function(i, val) {
			if (!$(this).is(":checked")) {
				$(this).trigger("change");
			}
		});

		isToggleControls = true;
	};

	var preferenceValueFromId = function(id, result) {
		if (id === "disabled-domain") {
			return result["domain"];
		} else if (id === "disabled-directory") {
			return result["directory"];
		} else {
			return result["url"];
		}
	};

	var notifyAllTabs = function() {
		chrome.tabs.getAllInWindow(null, function(tabs) {
			for (var i = 0; i < tabs.length; i++) {
				if (!tabs[i].url.match(/^chrome:\/\/extensions(.*)$/)) {
					linkblanker.updateStatus(tabs[i]);
				}				
			}
		});
	};

	initialize();
})(jQuery);