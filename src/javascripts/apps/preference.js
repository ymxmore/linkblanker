
var LinkBlanker = chrome.extension.getBackgroundPage().LinkBlanker;
var React = window.React = require('react');
var PreferenceActions = require('../actions/PreferenceActions');
var PreferenceStore = require('../stores/PreferenceStore');

var keyMappings = {
  3:  'cancel',
  8:  'backspace',
  9:  'tab',
  12: 'clear',
  13: 'enter',
  16: 'shift',
  17: 'ctrl',
  18: 'alt',
  19: 'pause',
  20: 'capslock',
  27: 'escape',
  28: 'maekouho',
  29: 'muhenkan',
  32: 'space',
  33: 'pageup',
  34: 'pagedown',
  35: 'end',
  36: 'home',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  41: 'select',
  42: 'printscreen',
  43: 'execute',
  44: 'snapshot',
  45: 'insert',
  46: 'delete',
  47: 'help',

  48: '0',
  49: '1',
  50: '2',
  51: '3',
  52: '4',
  53: '5',
  54: '6',
  55: '7',
  56: '8',
  57: '9',

  65: 'A',
  66: 'B',
  67: 'C',
  68: 'D',
  69: 'E',
  70: 'F',
  71: 'G',
  72: 'H',
  73: 'I',
  74: 'J',
  75: 'K',
  76: 'L',
  77: 'M',
  78: 'N',
  79: 'O',
  80: 'P',
  81: 'Q',
  82: 'R',
  83: 'S',
  84: 'T',
  85: 'U',
  86: 'V',
  87: 'W',
  88: 'X',
  89: 'Y',
  90: 'Z',

  91:  'command',
  92:  'command',
  93:  'command',
  145: 'scrolllock',
  186: 'colon',
  187: 'semicolon',
  188: 'comma',
  189: 'hyphen',
  190: 'period',
  191: 'slash',
  192: 'at',
  219: 'openbracket',
  220: 'yen',
  226: 'backslash',
  221: 'closebracket',
  222: 'caret',
  242: 'katakana',
  243: 'zenkaku',
  244: 'hankaku',

  96:  '0(num)',
  97:  '1(num)',
  98:  '2(num)',
  99:  '3(num)',
  100: '4(num)',
  101: '5(num)',
  102: '6(num)',
  103: '7(num)',
  104: '8(num)',
  105: '9(num)',
  106: 'multiply(num)',
  107: 'add(num)',
  108: 'enter(num)',
  109: 'subtract(num)',
  110: 'decimal(num)',
  111: 'devide(num)',
  144: 'lock(num)',
  112: 'f1',
  113: 'f2',
  114: 'f3',
  115: 'f4',
  116: 'f5',
  117: 'f6',
  118: 'f7',
  119: 'f8',
  120: 'f9',
  121: 'f10',
  122: 'f11',
  123: 'f12',
};

var Preference = React.createClass({
  getInitialState: function () {
    return {
      'disabled-extension': false,
      'disabled-off': true,
      'disabled-domain': false,
      'disabled-directory': false,
      'disabled-page': false,
      'enabled-background-open': false,
      'enabled-multiclick-close': false,
      'shortcut-key-toggle-enabled': ''
    };
  },

  getDefaultProps: function () {
    return {
      'shortcut-key-toggle-enabled': {
        restore: true,
        value: ''
      }
    }
  },

  componentDidMount: function () {
    var self = this;

    PreferenceStore.getAll(function (state) {
      var props = {
        'shortcut-key-toggle-enabled': {
          restore: true,
          value: state['shortcut-key-toggle-enabled'],
        }
      };

      var keyMap = getKeyMapping(state['shortcut-key-toggle-enabled']);
      state['shortcut-key-toggle-enabled'] = keyMap.keyNames.join(' + ');

      self.setState(state);
      self.setProps(props);
    });
  },

  handleChange: function (event) {
    var state = {};

    switch (event.target.id) {
      case 'disabled-off':
      case 'disabled-domain':
      case 'disabled-directory':
      case 'disabled-page':
        state = {
          'disabled-off': false,
          'disabled-domain': false,
          'disabled-directory': false,
          'disabled-page': false
        };
      case 'disabled-extension':
      case 'enabled-background-open':
      case 'enabled-multiclick-close':
        state[event.target.id] = event.target.checked;
        this.setState(state);
        break;
      case 'shortcut-key-toggle-enabled':
        if (!this.props['shortcut-key-toggle-enabled'].restore) {
          return;
        }

        state['shortcut-key-toggle-enabled'] = this.props['shortcut-key-toggle-enabled'].value;
        break;
    }

    PreferenceActions.save(state);
  },

  handleKeyDown: function (event) {
    switch (event.target.id) {
      case 'shortcut-key-toggle-enabled':
        var state = { 'shortcut-key-toggle-enabled': '' };
        var props = {
          'shortcut-key-toggle-enabled': {
            restore: false,
            value: '',
          }
        };

        if (46 !== event.keyCode && 8 !== event.keyCode) {
          var keyMap = getKeyMapping(
            (this.props['shortcut-key-toggle-enabled'].restore)
              ? ''
              : this.props['shortcut-key-toggle-enabled'].value
          );

          if (keyMap.keyCodes.indexOf(event.keyCode) > -1) {
            return;
          }

          if (keyMappings[event.keyCode]) {
            keyMap.keyNames.push(keyMappings[event.keyCode]);
            keyMap.keyCodes.push(event.keyCode);

            state['shortcut-key-toggle-enabled'] = keyMap.keyNames.join(' + ');
            props['shortcut-key-toggle-enabled'].value = keyMap.keyCodes.join(',');
          }
        }

        this.setState(state);
        this.setProps(props);

        break;
    }
  },

  handleKeyUp: function (event) {
    switch (event.target.id) {
      case 'shortcut-key-toggle-enabled':
        this.setProps({
          'shortcut-key-toggle-enabled': {
            restore: true,
            value: this.props['shortcut-key-toggle-enabled'].value
          }
        });

        this.handleChange.apply(this, [ event ]);
        break;
    }
  },

  render: function () {
    return (
      <div id="wrapper">
        <header id="extension-name">
          <span id="version-name">Version {LinkBlanker.manifest.version}</span>
        </header>
        <section>
          <h2 className="preference-header">{chrome.i18n.getMessage('title_whole_setting')}</h2>
          <ul className="preference-list">
            <li>
              <label>
                <input id="disabled-extension" type="checkbox" data-group="0" name="disabled-extension" checked={this.state['disabled-extension']} onChange={this.handleChange} />
                <span>{chrome.i18n.getMessage("title_pause")}</span>
              </label>
            </li>
          </ul>
        </section>
        <section>
          <h2 className="preference-header">{chrome.i18n.getMessage('title_open_settings')}</h2>
          <ul className="preference-list">
            <li>
              <label>
                <input id="disabled-off" type="radio" data-group="1" name="disabled-1" value="1" checked={this.state['disabled-off']} onChange={this.handleChange} />
                <span>{chrome.i18n.getMessage("title_disabled_off")}</span>
              </label>
            </li>
            <li>
              <label>
                <input id="disabled-domain" type="radio" data-group="1" name="disabled-1" value="2" checked={this.state['disabled-domain']} onChange={this.handleChange} />
                <span>{chrome.i18n.getMessage("title_disabled_domain")}</span>
              </label>
            </li>
            <li>
              <label>
                <input id="disabled-directory" type="radio" data-group="1" name="disabled-1" value="3" checked={this.state['disabled-directory']} onChange={this.handleChange} />
                <span>{chrome.i18n.getMessage("title_disabled_directory")}</span>
              </label>
            </li>
            <li>
              <label>
                <input id="disabled-page" type="radio" data-group="1" name="disabled-1" value="4" checked={this.state['disabled-page']} onChange={this.handleChange} />
                <span>{chrome.i18n.getMessage("title_disabled_page")}</span>
              </label>
            </li>
            <li className="list-split">
              <label>
                <input id="enabled-background-open" type="checkbox" data-group="2" name="enabled-background-open" checked={this.state['enabled-background-open']} onChange={this.handleChange} />
                <span>{chrome.i18n.getMessage("title_background_open")}</span>
              </label>
            </li>
          </ul>
        </section>
        <section>
          <h2 className="preference-header">{chrome.i18n.getMessage('title_close_settings')}</h2>
          <ul className="preference-list">
            <li>
              <label>
                <input id="enabled-multiclick-close" type="checkbox" data-group="3" name="enabled-multiclick-close" checked={this.state['enabled-multiclick-close']} onChange={this.handleChange} />
                <span>{chrome.i18n.getMessage("title_multiclick_close")}</span>
              </label>
            </li>
          </ul>
        </section>
        <section>
          <h2 className="preference-header">{chrome.i18n.getMessage('title_shortcut_key')}</h2>
          <ul className="preference-list">
            <li>
              <label>
                <p>{chrome.i18n.getMessage("title_enable_toggle_key")}</p>
                <input id="shortcut-key-toggle-enabled" type="text" data-group="4" name="shortcut-key-toggle-enabled" className="indent" placeholder="Enter the shortcut key" value={this.state['shortcut-key-toggle-enabled']} onChange={this.handleChange} onKeyDown={this.handleKeyDown} onKeyUp={this.handleKeyUp} />
              </label>
            </li>
          </ul>
        </section>
        <footer>
          <h2 className="preference-header">Links</h2>
          <ul className="preference-list">
            <li>
              <a href="http://www.aozora-create.com/service/linkblanker" title="Link Blanker" target="_blank">
                {chrome.i18n.getMessage("title_link_help")}
              </a>
            </li>
          </ul>
        </footer>
      </div>
    );
  }
});

React.render(
    <Preference />,
    document.getElementById('preference')
);

// console.log(chrome.extension.getBackgroundPage());

function getKeyMapping (keyCode) {
  keyCode = keyCode || '';

  var keyCodes = keyCode.split(',').filter(function (val) {
    return val !== '';
  }).map(function (val) {
    return Number(val);
  });

  var keyNames = keyCodes.map(function (val) {
    return keyMappings[val];
  });

  return { keyCodes: keyCodes, keyNames: keyNames };
};

// ;(function ($){
// 	var options = [
// 		{ id: "disabled-extension",          group: 0, control: "checkbox", label: chrome.i18n.getMessage("title_pause") },
// 		{ id: "disabled-off",                group: 1, control: "radio",    value: 0, label: chrome.i18n.getMessage("title_disabled_off") },
// 		{ id: "disabled-on",                 group: 1, control: "radio",    value: 1, label: chrome.i18n.getMessage("title_disabled_on") },
// 		{ id: "disabled-domain",             group: 1, control: "radio",    value: 2, label: chrome.i18n.getMessage("title_disabled_domain") },
// 		{ id: "disabled-directory",          group: 1, control: "radio",    value: 3, label: chrome.i18n.getMessage("title_disabled_directory") },
// 		{ id: "disabled-page",               group: 1, control: "radio",    value: 4, label: chrome.i18n.getMessage("title_disabled_page") },
// 		{ id: "enabled-background-open",     group: 2, control: "checkbox", listClass: "list-split", label: chrome.i18n.getMessage("title_background_open") },
// 		{ id: "enabled-multiclick-close",    group: 3, control: "checkbox", label: chrome.i18n.getMessage("title_multiclick_close") },
// 		{ id: "shortcut-key-toggle-enabled", group: 4, control: "text",     label: chrome.i18n.getMessage("title_enable_toggle_key"), placeholder: "Enter the shortcut key" },
// 	];

// 	var moreLink = [
// 		'<h2 class="preference-header">Links</h2>',
// 		'<ul class="preference-list">',
// 		'<li><a href="http://www.aozora-create.com/service/linkblanker" title="Link Blanker" target="_blank">' + chrome.i18n.getMessage("title_link_help") + '</a></li>',
// 		'</ul>',
// 	].join("");


// 	var keyMappings = {
//         "3": "cancel",
//         "8": "backspace",
//         "9": "tab",
//         "12": "clear",
//         "13": "enter",
//         "16": "shift",
//         "17": "ctrl",
//         "18": "alt",
//         "19": "pause",
//         "20": "capslock",
//         "27": "escape",
//         "28": "maekouho",
//         "29": "muhenkan",
//         "32": "space",
//         "33": "pageup",
//         "34": "pagedown",
//         "35": "end",
//         "36": "home",
//         "37": "left",
//         "38": "up",
//         "39": "right",
//         "40": "down",
//         "41": "select",
//         "42": "printscreen",
//         "43": "execute",
//         "44": "snapshot",
//         "45": "insert",
//         "46": "delete",
//         "47": "help",

//         "48": "0",
//         "49": "1",
//         "50": "2",
//         "51": "3",
//         "52": "4",
//         "53": "5",
//         "54": "6",
//         "55": "7",
//         "56": "8",
//         "57": "9",

//         "65": "A",
//         "66": "B",
//         "67": "C",
//         "68": "D",
//         "69": "E",
//         "70": "F",
//         "71": "G",
//         "72": "H",
//         "73": "I",
//         "74": "J",
//         "75": "K",
//         "76": "L",
//         "77": "M",
//         "78": "N",
//         "79": "O",
//         "80": "P",
//         "81": "Q",
//         "82": "R",
//         "83": "S",
//         "84": "T",
//         "85": "U",
//         "86": "V",
//         "87": "W",
//         "88": "X",
//         "89": "Y",
//         "90": "Z",

//         "91": "command",
//         "92": "command",
//         "93": "command",
//         "145": "scrolllock",
//         "186": "colon",
//         "187": "semicolon",
//         "188": "comma",
//         "189": "hyphen",
//         "190": "period",
//         "191": "slash",
//         "192": "at",
//         "219": "openbracket",
//         "220": "yen",
//         "226": "backslash",
//         "221": "closebracket",
//         "222": "caret",
//         "242": "katakana",
//         "243": "zenkaku",
//         "244": "hankaku",

//         "96": "0(num)",
//         "97": "1(num)",
//         "98": "2(num)",
//         "99": "3(num)",
//         "100": "4(num)",
//         "101": "5(num)",
//         "102": "6(num)",
//         "103": "7(num)",
//         "104": "8(num)",
//         "105": "9(num)",
//         "106": "multiply(num)",
//         "107": "add(num)",
//         "108": "enter(num)",
//         "109": "subtract(num)",
//         "110": "decimal(num)",
//         "111": "devide(num)",
//         "144": "lock(num)",
//         "112": "f1",
//         "113": "f2",
//         "114": "f3",
//         "115": "f4",
//         "116": "f5",
//         "117": "f6",
//         "118": "f7",
//         "119": "f8",
//         "120": "f9",
//         "121": "f10",
//         "122": "f11",
//         "123": "f12",
//     };

// 	var linkblanker = chrome.extension.getBackgroundPage().linkblanker;

// 	var isToggleControls = true;

// 	var initializedCount = 0;

// 	var initialize = function () {
// 		renderHtml();
// 	};

// 	var renderHtml = function () {
// 		linkblanker.currentData(function (result) {
// 			var html;

// 			if (result.url.match(/^chrome:\/\/(.*)$/)) {
// 				html = [
// 					'<div id="wrapper">',
// 					getLogoHtml(),
// 					'<h2 class="preference-header-disabled">' + chrome.i18n.getMessage("message_cannot_use") + '</h2>',
// 					moreLink,
// 					'</div>'
// 				];

// 				$("body").append(html.join(""));
// 				return;
// 			}

// 			var openList = [], closeList = [], shortCutList = [];

// 			for (var i = 1; i < options.length; i++) {
// 				switch (options[i].group) {
// 				case 1:
// 				case 2:
// 					openList.push(getListHtml(i));
// 					break;
// 				case 3:
// 					closeList.push(getListHtml(i));
// 					break;
// 				case 4:
// 					shortCutList.push(getListHtml(i));
// 					break;
// 				}
// 			}

// 			html = [
// 				'<div id="wrapper">',
// 				getLogoHtml(),
// 				'<h2 class="preference-header">' + chrome.i18n.getMessage("title_whole_setting") + '</h2>',
// 				'<ul class="preference-list">',
// 				getListHtml(0),
// 				'</ul>',
// 				'<h2 class="preference-header">' + chrome.i18n.getMessage("title_open_settings") + '</h2>',
// 				'<ul class="preference-list">',
// 				openList.join(""),
// 				'</ul>',
// 				'<h2 class="preference-header">' + chrome.i18n.getMessage("title_close_settings") + '</h2>',
// 				'<ul class="preference-list">',
// 				closeList.join(""),
// 				'</ul>',
// 				'<h2 class="preference-header">' + chrome.i18n.getMessage("title_shortcut_key") + '</h2>',
// 				'<ul class="preference-list">',
// 				shortCutList.join(""),
// 				'</ul>',
// 				moreLink,
// 				'</div>'
// 			];

// 			$("body").append(html.join(""));
// 			$("input[type=checkbox], input[type=radio]").change(onChange);

// 			$('[id^=shortcut-key-]').on("keydown", function (e) {
// 				var self = $(this);

// 				if (e.keyCode === 46 || e.keyCode === 8){
// 					self.val("").data("value", "");
// 				} else {
// 					if (self.data("restore")) {
// 						self.val("").data("value", "");
// 					}

// 					self.data("restore", false);

// 					var keyMap = getKeyMapping(self.data("value"));

// 					if (keyMappings[e.keyCode]) {
// 						keyMap.keyNames.push(keyMappings[e.keyCode]);
// 						keyMap.keyCodes.push(e.keyCode);

// 						self.val(keyMap.keyNames.join(' + '));
// 						self.data("value", keyMap.keyCodes.join(','));
// 					}
// 				}

// 				return false;
// 			}).on("keyup", function (e) {
// 				var self = $(this);
// 				self.data("restore", true);
// 				onChange.apply(this, []);
// 			}).data("restore", true);

// 			setInitialData();
// 		});
// 	};

// 	var getKeyMapping = function (keyCode) {
// 		keyCode = keyCode || "";

// 		var keyCodes = $.grep(keyCode.split(','), function (val){return val !== "";});
// 		var keyNames = $.map(keyCodes, function (val) {
// 			return keyMappings[val];
// 		});

// 		return { keyCodes: keyCodes, keyNames: keyNames };
// 	};

// 	var getLogoHtml = function () {
// 		return [
// 			'<div id="extension-name"><span id="version-name">Version ',
// 			linkblanker.manifest.version,
// 			'</span></div>'
// 		].join("");
// 	};

// 	var getListHtml = function (optionsIndex) {
// 		if (options[optionsIndex].control === "checkbox") {
// 			return [
// 				'<li ',
// 				options[optionsIndex].listClass ? 'class="' + options[optionsIndex].listClass + '"' : '',
// 				'><label data-group="',
// 				options[optionsIndex].group,
// 				'"><input id="',
// 				options[optionsIndex].id,
// 				'" type="checkbox" data-group="',
// 				options[optionsIndex].group,
// 				'" name="',
// 				options[optionsIndex].id,
// 				'" /><span>',
// 				options[optionsIndex].label,
// 				'</span></label></li>'
// 			].join("");
// 		} else if (options[optionsIndex].control === "text") {
// 			return [
// 				'<li ',
// 				options[optionsIndex].listClass ? 'class="' + options[optionsIndex].listClass + '"' : '',
// 				'><label data-group="',
// 				options[optionsIndex].group,
// 				'"><p>',
// 				options[optionsIndex].label,
// 				'</p><input id="',
// 				options[optionsIndex].id,
// 				'" type="text" data-group="',
// 				options[optionsIndex].group,
// 				'" name="',
// 				options[optionsIndex].id,
// 				'" class="indent"',
// 				options[optionsIndex].placeholder ? ' placeholder="' + options[optionsIndex].placeholder + '"' : '',
// 				' /></label></li>'
// 			].join("");
// 		} else {
// 			return [
// 				'<li ',
// 				options[optionsIndex].listClass ? 'class="' + options[optionsIndex].listClass + '"' : '',
// 				'><label data-group="',
// 				options[optionsIndex].group,
// 				'" data-value="',
// 				options[optionsIndex].value,
// 				'"><input id="',
// 				options[optionsIndex].id,
// 				'" type="radio" data-group="',
// 				options[optionsIndex].group,
// 				'" name="radio-',
// 				options[optionsIndex].group,
// 				'" value="',
// 				options[optionsIndex].value,
// 				'"/><span>',
// 				options[optionsIndex].label,
// 				'</span></label></li>'
// 			].join("");
// 		}
// 	};

// 	var setInitialData = function () {
// 		$.each(options, function (index, obj) {
// 			var self = $("#" + obj.id),
// 				id   = self.attr("id"),
// 				type = self.attr("type");

// 			self.removeAttr("checked");

// 			if (localStorage[id]) {
// 				if (type === "checkbox" || id === "disabled-on") {
// 					if (localStorage[id] == 1) {
// 						self.attr("checked", "checked");
// 					}

// 					checkInitializeFinish();
// 				} else if (type === "text") {
// 					if (id.indexOf("shortcut-key-") > -1) {
// 						var keyMap = getKeyMapping(localStorage[id]);
// 						self.val(keyMap.keyNames.join(' + '));
// 						self.data("value", keyMap.keyCodes.join(','));
// 					} else {
// 						self.val(localStorage[id]);
// 					}

// 					checkInitializeFinish();
// 				} else {
// 					linkblanker.currentData(function (result) {
// 						var val  = preferenceValueFromId(id, result),
// 							data = linkblanker.getData();

// 						if (id === "disabled-directory") {
// 							for (var i = 0; i < data[id].length; i++) {
// 								if (val.match(new RegExp("^" + data[id][i] + ".*$"))) {
// 									self.attr("checked", "checked");
// 									break;
// 								}
// 							}
// 						} else {
// 							if (data[id].indexOf(val) > -1) {
// 								self.attr("checked", "checked");
// 							}
// 						}

// 						checkInitializeFinish();
// 					});
// 				}
// 			} else {
// 				if (obj.default) {
// 					self.attr("checked", "checked");
// 				}

// 				checkInitializeFinish();
// 			}
// 		});
// 	};

// 	var checkInitializeFinish = function () {
// 		initializedCount++;

// 		if (initializedCount == options.length - 1) {
// 			toggleControls();
// 		}
// 	};

// 	var onChange = function () {
// 		var self    = $(this),
// 			id      = this.id,
// 			type    = this.type,
// 			value   = this.value,
// 			checked = self.is(":checked");

// 		if (type === "checkbox" || id === "disabled-on") {
// 			localStorage[id] = checked ? 1 : 0;
// 		} else if (type === "text") {
// 			localStorage[id] = self.data("value") || value;
// 		} else if (value >= 2) {
// 			linkblanker.currentData(function (result) {
// 				var val   = preferenceValueFromId(id, result),
// 					data  = linkblanker.getData(),
// 					index = data[id].indexOf(val);

// 				if (checked) {
// 					if (index == -1) {
// 						data[id].push(val);
// 					}
// 				} else {
// 					if (index > -1) {
// 						data[id].splice(index, 1);
// 					}
// 				}

// 				localStorage[id] = JSON.stringify(data[id]);
// 			});
// 		}

// 		if (isToggleControls) {
// 			toggleControls();
// 			linkblanker.notifyAllTabs();
// 		}
// 	};

// 	var toggleControls = function () {
// 		isToggleControls = false;

// 		if ($('input[data-group="1"]:checked').size() === 0) {
// 			$('input[data-group="1"]:eq(0)').attr("checked", "checked");
// 		}

// 		var groups = $.unique(options.map(function (x) {
// 			return x.group;
// 		})).sort();

// 		for (var i = 0; i < groups.length; i++) {
// 			toggleControlByGroup(groups[i]);
// 		}

// 		$('input[data-group="1"]').each(function (i, val) {
// 			if (!$(this).is(":checked")) {
// 				$(this).trigger("change");
// 			}
// 		});

// 		isToggleControls = true;
// 	};

// 	var toggleControlByGroup = function (group) {
// 		$('input[data-group="' + group + '"]').each(function (j, val) {
// 			var self = $(this);

// 			switch (group) {
// 			case 0:
// 				if (self.is(":checked")) {
// 					$('[data-group="1"], [data-group="2"], [data-group="3"]').attr("disabled", "disabled");
// 				} else {
// 					$('[data-group="1"], [data-group="2"], [data-group="3"]').removeAttr("disabled");
// 				}

// 				break;
// 			case 1:
// 				if (!$('input[data-group="0"]').is(":checked") && self.val() === 0) {
// 					if (self.is(":checked")) {
// 						$('[data-group="2"]').removeAttr("disabled");
// 					} else {
// 						$('[data-group="2"]').attr("disabled", "disabled");
// 					}
// 				}

// 				break;
// 			}

// 			if (self.is(":checked")) {
// 				self.parents("label").addClass("active");
// 			} else {
// 				self.parents("label").removeClass("active");
// 			}
// 		});
// 	};

// 	var preferenceValueFromId = function (id, result) {
// 		if (id === "disabled-domain") {
// 			return result.domain;
// 		} else if (id === "disabled-directory") {
// 			return result.directory;
// 		} else {
// 			return result.url;
// 		}
// 	};

// 	initialize();
// })(jQuery);
