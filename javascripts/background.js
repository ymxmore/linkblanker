var linkblanker;

;(function(background){
	var LinkBlanker = function() {
		var _this = this, _data;

		var initialize = function() {
			updateData();

			chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
				_this.updateStatus(tab);
			});
		};

		var updateData = function() {
			_data = {
				"disabled-extension": Number(localStorage["disabled-extension"] || "0"),
				"disabled-domain": JSON.parse(localStorage["disabled-domain"] || "[]"),
				"disabled-directory": JSON.parse(localStorage["disabled-directory"] || "[]"),
				"disabled-page": JSON.parse(localStorage["disabled-page"] || "[]")
			};
		};

		this.getData = function() {
			updateData();
			return _data;
		};

		this.updateStatus = function(tab) {
			if (!tab.url.match(/^chrome:\/\/extensions(.*)$/)) {
				var enable = _this.enableFromUrl(tab.url);
				chrome.tabs.sendRequest(tab.id, { enable: enable });
				chrome.browserAction.setBadgeBackgroundColor({
					color: enable ? [0,0,200,128] : [200,0,0,128],
					tabId: tab.id
				});
				chrome.browserAction.setBadgeText({
					text: enable ? "RUN" : "STOP",
					tabId: tab.id
				});
			}
		};

		this.currentEnable = function(callback) {
			if (callback) {
				_this.currentData(function(result) {
					callback(_this.enableFromFullData(result));
				});
			}
		};

		this.enableFromFullData = function(info) {
			updateData();

			var result = _data["disabled-extension"] == 0 && _data["disabled-domain"].indexOf(info.domain) == -1 && _data["disabled-page"].indexOf(info.url) == -1;

			if (result) {
				for (var i = 0; i < _data["disabled-directory"].length; i++) {				
					if (info.url.match(new RegExp("^" + _data["disabled-directory"][i] + ".*$"))) {
						result = false;
						break;
					}
				}
			}

			return result ? 1 : 0;
		};

		this.enableFromUrl = function(url) {
			return _this.enableFromFullData(_this.parseData(url));
		};

		this.currentData = function(callback) {
			if (callback) {
				chrome.tabs.getSelected(null, function(tab) {
					_this.parseData(tab.url, callback);
				});
			}
		};

		this.parseData = function(url, callback) {
			url = encodeURI(url);

			var result = {
				domain: "",
				directory: "",
				url: url
			}

			var sp = result.url.split('/');

			if (sp) {
				if (sp.length > 2) {
					result.domain = sp[2];
				} 

				if (sp.length > 4) {
					sp.splice(sp.length - 1, 1);
				}

				result.directory = sp.join("/");
			}

			if (callback) {
				callback(result);	
			}
			
			return result;
		};

		initialize();

		return _this;
	};

	background.linkblanker = new LinkBlanker();
})(this);