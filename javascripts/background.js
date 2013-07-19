var linkblanker;

;(function(background){
	var LinkBlanker = function() {
		var _this = this, _data;

		this.manifest;

		var initialize = function() {
			updateData();

			chrome.tabs.getAllInWindow(null, function(tabs) {
				for (var i = 0; i < tabs.length; i++) {
					_this.updateStatus(tabs[i], 1);
				}
			});

			chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
				_this.updateStatus(tab);
			});

			chrome.extension.onConnect.addListener(function(port) {
				port.onMessage.addListener(_this[port.name]);
			});

			loadManifest();
		};

		var updateData = function() {
			_data = {
				"disabled-extension": Number(localStorage["disabled-extension"] || "0"),
				"disabled-on": Number(localStorage["disabled-on"] || "0"),
				"disabled-domain": JSON.parse(localStorage["disabled-domain"] || "[]"),
				"disabled-directory": JSON.parse(localStorage["disabled-directory"] || "[]"),
				"disabled-page": JSON.parse(localStorage["disabled-page"] || "[]"),
				"enabled-multiclick-close": Number(localStorage["enabled-multiclick-close"] || "0"),
			};
		};

		var loadManifest = function() {
			var url = chrome.extension.getURL('/manifest.json'),
				xhr = new XMLHttpRequest();

			xhr.onload = function(){
				_this.manifest = JSON.parse(xhr.responseText);
			};

			xhr.open('GET', url, true);
			xhr.send(null);
		};

		this.getData = function() {
			updateData();
			return _data;
		};

		this.updateStatus = function(tab, reload) {
			var enable = _this.enableFromUrl(tab.url);
			reload = reload || 0;
			
			if (!reload) {
				chrome.tabs.sendMessage(tab.id, { 
					enable: enable, 
					multiClickClose: _data["enabled-multiclick-close"] == 1 && _data["disabled-extension"] == 0 ? 1 : 0
				});
			}

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

			if (info.url.match(/^chrome:\/\/(.*)$/)) {
				return 0;
			}

			var result = _data["disabled-extension"] == 0 && _data["disabled-on"] == 0 && _data["disabled-domain"].indexOf(info.domain) == -1 && _data["disabled-page"].indexOf(info.url) == -1;

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

		this.notifyAllTabs = function() {
			chrome.tabs.getAllInWindow(null, function(tabs) {
				for (var i = 0; i < tabs.length; i++) {
					linkblanker.updateStatus(tabs[i]);
				}
			});
		};

		this.removeTabs = function(message) {
			var close = false;

			chrome.tabs.getAllInWindow(null, function(tabs) {
				tabs.sort(function(a, b) {
					if (a.index < b.index) return message.align === "right" ? -1 : 1;
					if (a.index > b.index) return message.align === "right" ? 1  : -1;
					return 0;
				});

				var removeTabs = [];

				for (var i = 0; i < tabs.length; i++) {
					if (tabs[i].active) {
						close = true;
						continue;
					}

					if (close) {
						removeTabs.push(tabs[i].id);
					}
				}

				if (removeTabs.length > 0) {
					chrome.tabs.remove(removeTabs);
				}				
			});
		};

		initialize();

		return _this;
	};

	background.linkblanker = new LinkBlanker();
})(this);