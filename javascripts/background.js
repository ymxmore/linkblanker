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
				"disabled-page": JSON.parse(localStorage["disabled-page"] || "[]")
			};
		};

		this.getData = function() {
			updateData();
			return _data;
		};

		this.updateStatus = function(tab) {
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
			return (_data["disabled-extension"] == 0 && _data["disabled-domain"].indexOf(info.domain) == -1 && _data["disabled-page"].indexOf(info.url) == -1) ? 1 : 0;
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
			var result = {
				url: encodeURI(url),
				domain: ""
			}

			var sp = result.url.split('/');

			if (sp && sp.length > 2) {
				result.domain = sp[2];
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