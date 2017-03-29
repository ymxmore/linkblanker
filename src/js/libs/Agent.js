/*
 * libs/Agent.js
 */

import Tabs from './Tabs';
import Util from './Util';

/**
 * Agent
 *
 * @class
 * @classdesc 各ページで動くエージェントクラス
 */
export default class Agent {

  /**
   * コンストラクタ
   *
   * @constructor
   * @public
   * @param {Window} window ウィンドウオブジェクト
   * @param {Chrome} chrome Chromeオブジェクト
   */
  constructor(window, chrome) {
    this.window = window;
    this.chrome = chrome;
    this.anchorEvents = [];
    this.domContentLoaded = false;
    this.parsed = {};
    this.enabled = false;
    this.multiClickClose = false;
    this.isBackground = false;
    this.isVisibleLinkState = false;
    this.shortcutKeyTobbleEnabled = false;
    this.disabledSameDomain = false;
    this.ports = {};
    this.keys = [];
    this.operationEventHandler = {};
    this.receiveEventHandler = {};
    this.navigation = null;
    this.navigationTarget = null;
    this.mutationObserver = null;
    this.bindNodeTypes = [];
    this.navPrefix = null;
    this.navTargets = [];
    this.navStatuses = [];
    this.init();
  }

  /**
   * 初期化処理
   *
   * @private
   */
  init() {
    this.anchorEvents = [
      'click',
      'mouseenter',
      'mouseleave',
      'mousemove',
    ];

    this.navPrefix = 'linkblanker-status-';
    this.navTargets = ['icon', 'text'];
    this.navStatuses = ['enabled', 'disabled'];

    this.bindNodeTypes = [
      this.window.Node.DOCUMENT_NODE,
      this.window.Node.ELEMENT_NODE,
    ];

    this.operationEventHandler = this.getOperationEventHandler();
    this.receiveEventHandler = this.getReceiveEventHandler();

    this.chrome.extension.onMessage.addListener((response, sender) => {
      if ('name' in response
        && response.name in this.receiveEventHandler
        && typeof this.receiveEventHandler[response.name] === 'function') {
        // call receiver
        this.receiveEventHandler[response.name](response);
      }
    });

    this.portInitialize(
      'openTab',
      'undoRemoveTabs',
      'removeTabs',
      'toggleEnabled'
    );

    this.window.document.addEventListener(
      'DOMContentLoaded',
      this.onCompleted.bind(this)
    );

    this.window.addEventListener(
      'load',
      this.onCompleted.bind(this)
    );
  }

  /**
   * DOM構築完了のイベントハンドラ
   *
   * @private
   * @param {Object} e イベント
   */
  onCompleted(e) {
    if (this.domContentLoaded) {
      return;
    }

    this.domContentLoaded = true;

    this.setNavigation();
    this.bindEvents();
  }

  /**
   * ポートオブジェクトの初期化
   *
   * @private
   * @param {string[]} methods メソッド
   */
  portInitialize(...methods) {
    methods.forEach((method) => {
      let port = this.chrome.extension.connect({name: method});

      delete this.ports[method];

      port.onDisconnect.addListener(() => {
        this.ports[method] = false;
      });

      this.ports[method] = port;
    });
  }

  /**
   * イベントをバインド
   *
   * @private
   */
  bindEvents() {
    Object.keys(this.operationEventHandler).forEach((e) => {
      this.window.removeEventListener(e, this.operationEventHandler[e]);
    });

    this.bindAnchorEvents(this.window.document);

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    if (this.enabled) {
      this.mutationObserver = new this.window.MutationObserver((mrs) => {
        mrs.forEach((mr) => {
          this.bindAnchorEvents(Array.prototype.slice.call(mr.removedNodes), {
            click: false,
            mouseenter: false,
            mouseleave: false,
            mousemove: false,
          });
          this.bindAnchorEvents(Array.prototype.slice.call(mr.addedNodes));
        });
      });

      this.mutationObserver.observe(this.window.document, {
        childList: true,
        subtree: true,
      });
    }

    if (this.multiClickClose) {
      this.window.addEventListener('click', this.operationEventHandler.click);
    }

    if (this.shortcutKeyTobbleEnabled.length > 0) {
      this.window.addEventListener('keydown', this.operationEventHandler.keydown);
      this.window.addEventListener('keyup', this.operationEventHandler.keyup);
    }
  }

  /**
   * 指定されたノードに属するアンカーに対しイベントをバインド
   *
   * @private
   * @param {Object} node ノード
   * @param {Object} enabled イベントの有効状態
   */
  bindAnchorEvents(node, enabled) {
    if (typeof enabled === 'undefined') {
      enabled = {
        click: this.enabled,
        mouseenter: this.enabled && this.isVisibleLinkState,
        mouseleave: this.enabled && this.isVisibleLinkState,
        mousemove: this.enabled && this.isVisibleLinkState,
      };
    }

    let nodes = Util.isArray(node) ? node : [node];

    nodes.forEach((nd) => {
      if (nd
        && this.bindNodeTypes.indexOf(nd.nodeType) > -1
        && nd.nodeName
      ) {
        if (nd.nodeName.toLowerCase() !== 'a') {
          this.bindAnchorEvents(
            Array.prototype.slice.call(
              nd.getElementsByTagName('a')
            ),
            enabled
          );
        } else {
          this.anchorEvents.forEach((ae) => {
            nd.removeEventListener(ae, this.operationEventHandler[ae]);

            if (enabled[ae]) {
              if (!nd.dataset.lbOrigHref
                && nd.href
                && nd.href !== ''
              ) {
                nd.dataset.lbOrigHref = nd.href;
              }

              nd.addEventListener(ae, this.operationEventHandler[ae]);
            }
          });
        }
      }
    });
  }

  /**
   * システムステータスから別タブで開く必要があるかを返却
   *
   * @private
   * @return {boolean} 別タブで開く必要がある: true
   */
  isNeedOpenTabFromSystemStatus() {
    return this.enabled && this.ports.openTab;
  }

  /**
   * URLから別タブで開く必要があるかを返却
   *
   * @private
   * @param {string} url URL
   * @return {boolean} 別タブで開く必要がある: true
   */
  isNeedOpenTabFromUrl(url) {
    if (url && !url.match(/javascript:/i)) {
      let parsed = Util.parseUrl(url);
      let isSameDomain = (parsed.domain === this.parsed.domain);

      if ((isSameDomain && '' !== parsed.hash)
        || (this.disabledSameDomain && isSameDomain)
      ) {
        return false;
      }

      return true;
    }

    return false;
  }

  /**
   * DOMオブジェクトから別タブで開く必要があるかを返却
   *
   * @private
   * @param {Object} dom DOMオブジェクト
   * @return {boolean} 別タブで開く必要がある: true
   */
  isNeedOpenTabFromDOM(dom) {
    if (!dom || dom.onclick) {
      return false;
    }

    let url = null;

    if (dom.dataset.lbOrigHref) {
      url = dom.dataset.lbOrigHref;
    } else if (dom.href) {
      url = dom.href;
    }

    return (
      url
      && this.isNeedOpenTabFromUrl(this.absPath(url))
    );
  }

  /**
   * イベントから別タブで開く必要があるかを返却
   *
   * @private
   * @param {Object} e イベント
   * @return {boolean} 別タブで開く必要がある: true
   */
  isNeedOpenTabFromEvent(e) {
    if (!e) {
      return true;
    }

    return (
      !e.ctrlKey
      && !e.metaKey
      && !e.shiftKey
      && !e.defaultPrevented
    );
  }

  /**
   * クリックイベントから別タブで開く必要があるかを返却
   *
   * @private
   * @param {Object} e イベント
   * @return {boolean} 別タブで開く必要がある: true
   */
  isNeedOpenTabFromClickEvent(e) {
    if (!e) {
      return false;
    }

    return (
      e.button === 0
      && this.isNeedOpenTabFromEvent(e)
      && this.isNeedOpenTabFromDOM(this.getParentsNode(e.target, 'a'))
    );
  }

  /**
   * クリックイベントからURLを返却
   *
   * @private
   * @param {Object} e イベント
   * @param {boolean} [isFullUrl=false] フルURLが欲しい場合: true
   * @return {string} URL
   */
  getUrlFromClickEvent(e, isFullUrl = false) {
    if (e && e.target) {
      let target = this.getParentsNode(e.target, 'a');

      if (target && target.href) {
        return isFullUrl
          ? this.absPath(target.href)
          : target.href;
      }
    }

    return null;
  }

  /**
   * ナビゲーションをセット
   *
   * @private
   */
  setNavigation() {
    if (!this.window.document.body) {
      return;
    }

    let navc = this.window.document.getElementById('linkblanker-navigation');

    if (this.isVisibleLinkState) {
      if (navc) {
        return;
      }

      navc = this.window.document.createElement('div');
      navc.setAttribute('id', 'linkblanker-navigation');

      let navb = this.window.document.createElement('div');
      navb.setAttribute('id', 'linkblanker-navigation-balloon');

      navb.innerHTML = `
        <div id="linkblanker-status-icon">
          <img id="linkblanker-status-icon-enabled" src="${this.chrome.extension.getURL('/img/icon-enabled.svgz')}"/>
          <img id="linkblanker-status-icon-disabled" src="${this.chrome.extension.getURL('/img/icon-disabled.svgz')}"/>
        </div>
        <div id="linkblanker-status-text">
          <span id="linkblanker-status-text-enabled">ON</span>
          <span id="linkblanker-status-text-disabled">OFF</span>
        </div>
      `;

      navc.appendChild(navb);

      this.window.document.body.appendChild(navc);
      this.navigation = navb;
    } else {
      if (navc) {
        this.window.document.body.removeChild(navc);
      }
    }
  }

  /**
   * クリックイベントハンドラ
   *
   * @private
   * @param {Object} e イベント
   */
  onClick(e) {
    this.navigation.className = 'hide';
    this.navigation.style.display = 'none';

    let target = this.getParentsNode(e.target, 'a');

    if (target) {
      if (this.isNeedOpenTabFromSystemStatus()
        && this.isNeedOpenTabFromClickEvent(e)
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        let params = {
          url: this.getUrlFromClickEvent(e),
          selected: !this.isBackground,
        };

        this.ports.openTab.postMessage(params);
      }
    } else if (this.multiClickClose) {
      // multi clicks tab close.
      if (this.ports.removeTabs && e.detail === 3) {
        let align = (e.clientX > this.window.document.documentElement.clientWidth / 2) ? 'right' : 'left';

        this.ports.removeTabs.postMessage({
          align: align,
          clientX: e.clientX,
          clientY: e.clientY,
          pageX: e.pageX,
          pageY: e.pageY,
        });

        this.window.getSelection().collapse(this.window.document.body, 0);
      }
    }
  }

  /**
   * キーダウンイベントハンドラ
   *
   * @private
   * @param {Object} e イベント
   */
  onKeydown(e) {
    this.setNavigationState(e);

    let keyCode = Number(e.keyCode);

    if (this.keys.indexOf(keyCode) === -1) {
      this.keys.push(keyCode);
    }

    if (this.keys.length === this.shortcutKeyTobbleEnabled.length) {
      let exist = true;

      for (let i in this.keys) {
        if (-1 === this.shortcutKeyTobbleEnabled.indexOf(this.keys[i])) {
          exist = false;
          break;
        }
      }

      if (exist) {
        this.keys = [];

        if (this.ports.toggleEnabled) {
          this.ports.toggleEnabled.postMessage();
        }
      }
    }
  }

  /**
   * キーアップイベントハンドラ
   *
   * @private
   * @param {Object} e イベント
   */
  onKeyup(e) {
    this.setNavigationState(e);
    this.keys = [];
  }

  /**
   * マウスエンターイベントハンドラ
   *
   * @private
   * @param {Object} e イベント
   */
  onMouseenter(e) {
    let target = this.getParentsNode(e.target, 'a');

    if (target) {
      this.navigationTarget = target;

      if (this.setNavigationState(e)) {
        this.navigation.className = 'show';
        this.navigation.style.display = 'block';
      } else {
        this.navigation.className = 'hide';
        this.navigation.style.display = 'none';
      }
    }
  }

  /**
   * マウスムーブイベントハンドラ
   *
   * @private
   * @param {Object} e イベント
   */
  onMousemove(e) {
    if (this.navigation.className === 'show') {
      let top = e.pageY - this.navigation.clientHeight - 20;
      let left = e.pageX + 20;

      if (top < 0) {
        top = e.pageY + 20;
      }

      if (this.window.innerWidth < left + this.navigation.clientWidth) {
        left = e.pageX - this.navigation.clientWidth - 20;
      }

      this.navigation.style.top = `${top}px`;
      this.navigation.style.left = `${left}px`;
    }
  }

  /**
   * マウスリーブイベントハンドラ
   *
   * @private
   * @param {Object} e イベント
   */
  onMouseleave(e) {
    this.navigationTarget = null;

    setTimeout(() => {
      if (this.navigationTarget === null) {
        this.navigation.className = 'hide';

        setTimeout(() => {
          if (this.navigationTarget === null) {
            this.navigation.style.display = 'none';
          }
        }, 110);
      }
    }, 20);
  }

  /**
   * 操作イベントハンドラを返却
   *
   * @private
   * @return {Object} 操作イベントハンドラ
   */
  getOperationEventHandler() {
    return Util.bindAll({
      click: this.onClick,
      keydown: this.onKeydown,
      keyup: this.onKeyup,
      mouseenter: this.onMouseenter,
      mousemove: this.onMousemove,
      mouseleave: this.onMouseleave,
    }, this);
  }

  /**
   * ナビゲーションの状態をセット
   *
   * @private
   * @param {Object} e イベント
   * @return {boolean} 正常にセットした場合: true
   */
  setNavigationState(e) {
    if (!this.window.document.body || !this.isVisibleLinkState) {
      return false;
    }

    if (e && e.target) {
      if (this.getParentsNode(e.target, '#linkblanker-notify')) {
        return false;
      }
    }

    let isNeedOpenTab = this.navigationTarget
      && this.isNeedOpenTabFromSystemStatus()
      && this.isNeedOpenTabFromEvent(e)
      && this.isNeedOpenTabFromDOM(this.navigationTarget);

    for(let target of this.navTargets) {
      for(let status of this.navStatuses) {
        let elem = this.window.document.getElementById(
          `${this.navPrefix}${target}-${status}`
        );

        elem.style.display = (
          (isNeedOpenTab && status === 'enabled')
          || (!isNeedOpenTab && status === 'disabled'))
            ? 'block'
            : 'none';
      }
    }

    return true;
  }

  /**
   * 状態を更新
   *
   * @private
   * @param {Object} response レスポンス
   */
  onUpdateTabStatus(response) {
    if ('parsed' in response) {
      this.parsed = response.parsed;
    }

    if ('enabled' in response) {
      this.enabled = Boolean(response.enabled);
    }

    if ('isBackground' in response) {
      this.isBackground = Boolean(response.isBackground);
    }

    if ('multiClickClose' in response) {
      this.multiClickClose = Boolean(response.multiClickClose);
    }

    if ('isVisibleLinkState' in response) {
      this.isVisibleLinkState = Boolean(response.isVisibleLinkState);
    }

    if ('shortcutKeyTobbleEnabled' in response) {
      this.shortcutKeyTobbleEnabled = response.shortcutKeyTobbleEnabled
        .split(',')
        .filter((val) => '' !== val)
        .map((val) => Number(val));
    }

    if ('disabledSameDomain' in response) {
      this.disabledSameDomain = Boolean(response.disabledSameDomain);
    }

    this.setNavigation();
    this.bindEvents();
  }

  /**
   * タブの消去を通知
   *
   * @private
   * @param {Object} response レスポンス
   */
  onNorifyRemoveTabs(response) {
    let oldNotify = this.window.document.getElementById('linkblanker-notify');

    if (oldNotify) {
      oldNotify.hide(0);
    }

    let canvas = this.getCanvas(response);

    this.window.document.body.appendChild(canvas);

    let tabs = new Tabs(canvas);
    let align = response.align === 'left'
      ? tabs.REMOVE.RIGHT_TO_LEFT
      : tabs.REMOVE.LEFT_TO_RIGHT;

    tabs.show(response.removeTabsLength);

    setTimeout(() => {
      tabs.removeAll(align, (removed) => {
        canvas.setAttribute('class', 'hide');

        let notify = this.getNotify(response, removed);
        this.window.document.body.appendChild(notify);
        notify.show();

        setTimeout(() => {
          if (notify && notify.hide) {
            notify.hide();
          }
        }, 10000);

        setTimeout(() => {
          canvas.parentNode.removeChild(canvas);
        }, 210);
      });
    }, this.getWait(response));
  }

  /**
   * 受信ハンドラを返却
   *
   * @private
   * @return {Object} 受信ハンドラ
   */
  getReceiveEventHandler() {
    return Util.bindAll({
      updateTabStatus: this.onUpdateTabStatus,
      norifyRemoveTabs: this.onNorifyRemoveTabs,
    }, this);
  }

  /**
   * キャンバスを返却
   *
   * @private
   * @param {Object} param パラメータ
   * @return {Object} キャンバス
   */
  getCanvas(param) {
    let canvas = this.window.document.createElement('canvas');
    let meta = this.getCloseActionMetaInfo(param);

    let styles = [
      `top:${meta.top}px`,
      `left:${meta.left}px`,
      `width:${meta.width}px`,
      `height:${meta.height}px`,
      `border-radius:${Math.floor(meta.width / 2)}px`,
    ];

    canvas.setAttribute('id', 'linkblanker-canvas');
    canvas.setAttribute('class', 'show');
    canvas.setAttribute('width', meta.width);
    canvas.setAttribute('height', meta.height);
    canvas.setAttribute('style', styles.join(';') + ';');

    return canvas;
  }

  /**
   * ウェイト値
   *
   * @private
   * @param {Object} param パラメータ
   * @return {number} ウェイト値
   */
  getWait(param) {
    let wait = (50 * param.removeTabsLength);

    if (wait < 300) {
      wait = 300;
    } else if (wait > 500) {
      wait = 500;
    }

    return wait;
  }

  /**
   * クローズオブジェクトのメタ情報を返却
   *
   * @private
   * @param {Object} param パラメータ
   * @return {Object} クローズオブジェクトのメタ情報
   */
  getCloseActionMetaInfo(param) {
    let width = 300;
    let height = 300;
    let top = Math.floor(param.pageY) - Math.floor(height / 2);
    let left = Math.floor(param.pageX) - Math.floor(width / 2);
    let scrollTop = window.scrollY;
    let scrollLeft = window.scrollX;
    let docElem = this.window.document.documentElement;

    let viewport = {
      top: scrollTop,
      right: scrollLeft + docElem.clientWidth,
      bottom: scrollTop + docElem.clientHeight,
      left: scrollLeft,
    };

    if (top < viewport.top) {
      top = viewport.top;
    } else if (top + height > viewport.bottom) {
      top = viewport.bottom - height;
    }

    if (left < viewport.left) {
      left = viewport.left;
    } else if (left + width > viewport.right) {
      left = viewport.right - width;
    }

    return {
      width,
      height,
      top,
      left,
    };
  }

  /**
   * 通知オブジェクトを作成し返却
   *
   * @private
   * @param {Object} param パラメータ
   * @return {Object} フルURL
   */
  getNotify(param) {
    let notify = this.window.document.createElement('div');

    notify.innerHTML = `
      <img class="linkblanker-icon" src="${this.chrome.extension.getURL('img/icon-enabled.svgz')}" />
      <p class="linkblanker-message">
      ${this.chrome.i18n.getMessage('message_drop_tabs')
        .replace(
          '{REMOVE_TAB_ALIGN}',
          'left' === param.align
            ? this.chrome.i18n.getMessage('title_left')
            : this.chrome.i18n.getMessage('title_right')
        )
        .replace('{REMOVE_TAB_LENGTH}', param.removeTabsLength)}
      </p>
      <ul class="linkblanker-linkbox">
        <li>
          <a class="linkblanker-undo" href="#">
            ${this.chrome.i18n.getMessage('undo')}
          </a>
        </li>
        <li>
          <a class="linkblanker-notify-remove" href="#">
            ${this.chrome.i18n.getMessage('notify_remove')}
          </a>
        </li>
      </ul>
    `;

    notify.setAttribute('id', 'linkblanker-notify');

    notify.show = () => {
      notify.setAttribute('class', 'show');
    };

    notify.hide = (e, time) => {
      if (typeof e === 'object') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      } else {
        time = e;
      }

      if (notify) {
        notify.getElementsByClassName('linkblanker-notify-remove')[0]
          .removeEventListener('click', notify.hide);
        notify.setAttribute('class', 'hide');

        setTimeout(() => {
          if (notify && notify.parentNode) {
            notify.parentNode.removeChild(notify);
          }
        }, typeof time === 'undefined' ? 500 : time);
      }
    };

    notify.undo = (e) => {
      if (typeof e === 'object') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }

      notify.getElementsByClassName('linkblanker-undo')[0]
        .removeEventListener('click', notify.undo);
      notify.hide();

      if (this.ports.undoRemoveTabs) {
        this.ports.undoRemoveTabs.postMessage();
      }
    };

    notify.getElementsByClassName('linkblanker-undo')[0]
      .addEventListener('click', notify.undo);
    notify.getElementsByClassName('linkblanker-notify-remove')[0]
      .addEventListener('click', notify.hide);

    return notify;
  }

  /**
   * パスをフルURLにして返却
   *
   * @private
   * @param {string} path パス
   * @return {string} フルURL
   */
  absPath(path) {
    let e = this.window.document.createElement('div');
    e.innerHTML = `<a href="${path}"/>`;
    return e.firstChild.href;
  }

  /**
   * 親ノードを返却
   *
   * @private
   * @param {Object} node ノード
   * @param {string} target 対象のID or Class or タグ
   * @param {boolean} normalized 正規化済フラグ
   * @return {Object} 親ノード
   */
  getParentsNode(node, target, normalized) {
    if (!node || !target) {
      return false;
    }

    let regexp = null;
    let nodeprop = null;

    target = target.trim();

    if (/^#/.test(target)) {
      // id
      regexp = new RegExp(`^${target.slice(1)}$`);
      nodeprop = (node.id || '').trim();
    } else if (/^\./.test(target)) {
      // class
      regexp = new RegExp(`(^|\s)${target.slice(1)}($|\s)`);
      nodeprop = (node.className || '').trim();
    } else {
      // tag
      if (!normalized) {
        target = target.toLowerCase();
      }

      regexp = new RegExp(`^${target}$`);
      nodeprop = node.nodeName.toLowerCase();
    }

    if (nodeprop !== '' && regexp.test(nodeprop)) {
      return node;
    } else if (node.parentNode) {
      return this.getParentsNode(node.parentNode, target, true);
    }

    return false;
  }
}
