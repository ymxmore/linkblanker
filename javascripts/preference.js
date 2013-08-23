;(function($){
	var options = [
		{ id: "disabled-extension",       group: 0, control: "checkbox", label: "一時停止" },
		{ id: "disabled-off",             group: 1, control: "radio",    value: 0, label: "有効&nbsp;(強制的に新しいタブで開く)" },
		{ id: "disabled-on",              group: 1, control: "radio",    value: 1, label: "無効&nbsp;(ページ標準の振る舞い)" },
		{ id: "disabled-domain",          group: 1, control: "radio",    value: 2, label: "現在表示中のドメインでは無効にする" },
		{ id: "disabled-directory",       group: 1, control: "radio",    value: 3, label: "現在表示中のディレクトリ以下では無効にする" },
		{ id: "disabled-page",            group: 1, control: "radio",    value: 4, label: "現在表示中のページでは無効にする" },
		{ id: "enabled-background-open",  group: 2, control: "checkbox", listClass: "list-split", label: "バックグラウンドで開く" },
		{ id: "enabled-multiclick-close", group: 3, control: "checkbox", label: "トリプルクリッククローズ機能" },
	];

	var moreLink = [
		'<h2 class="preference-header">Links</h2>',
		'<ul class="preference-list">',
		'<li><a href="http://www.aozora-create.com/service/linkblanker" title="Link Blanker" target="_blank">機能・使い方・ヘルプ等はこちら</a></li>',
		'</ul>',
	].join("");

	var linkblanker = chrome.extension.getBackgroundPage().linkblanker;

	var isToggleControls = true;

	var initializedCount = 0;

	var initialize = function() {
		renderHtml();
	};

	var renderHtml = function() {
		linkblanker.currentData(function(result) {
			var html;

			if (result.url.match(/^chrome:\/\/extensions(.*)$/)) {
				html = [
					'<div id="wrapper">',
					getLogoHtml(),
					'<h2 class="preference-header-disabled">このページでは無効です。</h2>',
					moreLink,
					'</div>'
				];

				$("body").append(html.join(""));
				return;
			}

			var openList = [], closeList = [];

			for (var i = 1; i < options.length; i++) {
				switch (options[i].group) {
				case 1:
				case 2:
					openList.push(getListHtml(i));
					break;
				case 3:
					closeList.push(getListHtml(i));
					break;
				}
			}

			html = [
				'<div id="wrapper">',
				getLogoHtml(),
				'<h2 class="preference-header">全体設定</h2>',
				'<ul class="preference-list">',
				getListHtml(0),
				'</ul>',
				'<h2 class="preference-header">Open設定</h2>',
				'<ul class="preference-list">',
				openList.join(""),
				'</ul>',
				'<h2 class="preference-header">Close設定</h2>',
				'<ul class="preference-list">',
				closeList.join(""),
				'</ul>',
				moreLink,
				'</div>'
			];

			$("body").append(html.join(""));
			$("input[type=checkbox], input[type=radio]").change(checkboxOnChange);

			setInitialData();
		});
	};

	var getLogoHtml = function() {
		return [
			'<div id="extension-name"><span id="version-name">Version ',
			linkblanker.manifest.version,
			'</span></div>'
		].join("");
	};

	var getListHtml = function(optionsIndex) {
		if (options[optionsIndex].control === "checkbox") {
			return [
				'<li ',
				options[optionsIndex].listClass ? 'class="' + options[optionsIndex].listClass + '"' : '',
				'><label data-group="',
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
				'<li ',
				options[optionsIndex].listClass ? 'class="' + options[optionsIndex].listClass + '"' : '',
				'><label data-group="',
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
		$.each(options, function(index, obj) {
			var self = $("#" + obj.id),
				id   = self.attr("id"),
				type = self.attr("type");

			self.removeAttr("checked");

			if (localStorage[id]) {
				if (type === "checkbox" || id === "disabled-on") {
					if (localStorage[id] == 1) {
						self.attr("checked", "checked");
					}

					checkInitializeFinish();
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

						checkInitializeFinish();
					});
				}
			} else {
				if (obj.default) {
					self.attr("checked", "checked");
				}

				checkInitializeFinish();
			}
		});
	};

	var checkInitializeFinish = function() {
		initializedCount++;

		if (initializedCount == options.length - 1) {
			toggleControls();
		}
	};

	var checkboxOnChange = function() {
		var self    = $(this),
			id      = this.id,
			type    = this.type,
			value   = this.value,
			checked = self.is(":checked");

		if (type === "checkbox" || id === "disabled-on") {
			localStorage[id] = checked ? 1 : 0;
		} else if (value >= 2) {
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
			linkblanker.notifyAllTabs();
		}
	};

	var toggleControls = function() {
		isToggleControls = false;

		if ($('input[data-group="1"]:checked').size() === 0) {
			$('input[data-group="1"]:eq(0)').attr("checked", "checked");
		}

		var groups = $.unique(options.map(function(x) {
			return x.group;
		})).sort();

		for (var i = 0; i < groups.length; i++) {
			$('input[data-group="' + groups[i] + '"]').each(function(j, val) {
				var self = $(this);

				switch (groups[i]) {
				case 0:
					if (self.is(":checked")) {
						$('[data-group="1"], [data-group="2"], [data-group="3"]').attr("disabled", "disabled");
					} else {
						$('[data-group="1"], [data-group="2"], [data-group="3"]').removeAttr("disabled");
					}

					break;
				case 1:
					if (!$('input[data-group="0"]').is(":checked") && self.val() == 0) {
						if (self.is(":checked")) {
							$('[data-group="2"]').removeAttr("disabled");
						} else {
							$('[data-group="2"]').attr("disabled", "disabled");
						}
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

	initialize();
})(jQuery);
