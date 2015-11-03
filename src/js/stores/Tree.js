/**
 * stores/Tree.js
 */

var Api = require('../utils/Api');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var LinkBlankerConstants = require('../constants/LinkBlanker');
var Logger = require('../utils/Logger');
var EventType = LinkBlankerConstants.EventType;
var MessageName = LinkBlankerConstants.MessageName;
var assign = require('object-assign');

/**
 * TabLog tree
 */
var _tree = {};

var TreeStore = assign({}, EventEmitter.prototype, {

  get: function () {
    return _tree;
  },

  emitChange: function () {
    this.emit(EventType.CHANGE);
  },

  /**
   * @param {function} callback
   */
  addChangeListener: function (callback) {
    this.on(EventType.CHANGE, callback);
  },

  /**
   * @param {function} callback
   */
  removeChangeListener: function (callback) {
    this.removeListener(EventType.CHANGE, callback);
  },
});

AppDispatcher.register(function (action) {
  switch(action.type) {
    case EventType.RECEIVE_MESSAGE:
      var response = action.args[0];

      if ('name' in response) {
        switch (response.name) {
          case MessageName.SAVED_TAB_LOG:
          case MessageName.DELETED_TAB_LOG:
            Logger.debug('before sort', response.data);
            _tree = convertTreeFromTabLogs(response.data);
            Logger.debug('after sort', _tree);
            TreeStore.emitChange();
            break;
        }
      }

      break;
  }
});

function convertTreeFromTabLogs (tabLogs) {
  var tabLogArr = getValues(tabLogs);
  tabLogArr = getSortedTabsByOpenerTabId(tabLogArr);

  var index = {};
  var tree = [];

  tabLogArr.forEach(function (tabLog) {
    tabLog.children = [];

    if ('openerTabId' in tabLog.info && tabLog.info.openerTabId in index) {
      // child
      var idx = index[tabLog.info.openerTabId];
      var len = idx.length;
      var parent = { children: tree.concat() };

      Logger.debug('ikuze >>> ', tabLog.info.url, idx, parent);

      for (var i = 0; i < len; i++) {
        if (parent.children[idx[i]]) {
          // if (Api.isArray(parent[idx[i]])) {
          //   parent = parent[idx[i]].concat();
          // } else {
          //   parent = assign({}, parent[idx[i]]);
          // }
          parent = assign({}, parent.children[idx[i]]);
        } else {
          Logger.debug('noooooo!', tabLog.info.url, idx, parent, i);
          parent = null;
          break;
        }
      }

      if (parent) {
        Logger.debug('fix parent!', parent);
        parent.children.push(tabLog);
        index[tabLog.info.id] = idx.concat([ parent.children.length - 1 ]);
        Logger.debug('set child!', tabLog.info.url, index[tabLog.info.id]);
      } else {
        Logger.debug('no parent!', tabLog.info.url, idx, parent);
      }
    } else {
      // root
      tree.push(tabLog);
      index[tabLog.info.id] = [ tree.length - 1 ];
      Logger.debug('root!', tabLog.info.url, index[tabLog.info.id]);
    }
  });

  Logger.debug('convertTreeFromTabLogs', tree);

  return getSortedTabsByWindowIdAndIndex(tree);
}

function getValues (tabLogs) {
  return Object.keys(tabLogs).map(function (tabId) {
    return this[tabId];
  }, tabLogs);
}

function getSortedTabsByOpenerTabId (tabLogArr) {
  tabLogArr.sort(function (tab1, tab2) {
    var openerTabId1 = 0;
    var openerTabId2 = 0;

    if ('openerTabId' in tab1.info) {
      openerTabId1 = tab1.info.openerTabId;
    }

    if ('openerTabId' in tab2.info) {
      openerTabId2 = tab2.info.openerTabId;
    }

    if (openerTabId1 > openerTabId2) {
      return 1;
    }

    if (openerTabId1 < openerTabId2) {
      return -1;
    }

    return 0;
  });

  Logger.debug('getSortedTabsByOpenerTabId', tabLogArr);

  return tabLogArr;
}

function getSortedTabsByWindowIdAndIndex (tabLogArr) {
  tabLogArr.forEach(function (tabLog) {
    tabLog.children = getSortedTabsByWindowIdAndIndex(tabLog.children);
  });

  tabLogArr.sort(function (a, b) {
    if (a.info.windowId > b.info.windowId) {
      return 1;
    }

    if (a.info.windowId > b.info.windowId) {
      return -1;
    }

    if (a.info.index > b.info.index) {
      return 1;
    }

    if (a.info.index < b.info.index) {
      return -1;
    }

    return 0;
  });

  Logger.debug('getSortedTabsByWindowIdAndIndex', tabLogArr);

  return tabLogArr;
}

module.exports = TreeStore;
