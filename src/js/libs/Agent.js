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
    this.domContentLoaded = false;
    this.parsed = {};
    this.enabled = false;
    this.multiClickClose = false;
    this.isBackground = false;
    this.isVisibleLinkState = false;
    this.isLeftClick = true;
    this.isMiddleClick = false;
    this.isRightClick = false;
    this.shortcutKeyTobbleEnabled = false;
    this.disabledSameDomain = false;
    this.ports = {};
    this.keys = [];
    this.anchorEventHandler = {};
    this.windowEventHandler = {};
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
    this.navPrefix = 'linkblanker-status-';
    this.navTargets = ['icon', 'text'];
    this.navStatuses = ['enabled', 'disabled'];

    this.bindNodeTypes = [
      this.window.Node.DOCUMENT_NODE,
      this.window.Node.ELEMENT_NODE,
    ];

    this.anchorEventHandler = Util.bindAll({
      click: this.onAnchorClick,
      contextmenu: this.onAnchorContextmenu,
      mousedown: this.onAnchorMousedown,
      mouseenter: this.onAnchorMouseenter,
      mousemove: this.onAnchorMousemove,
      mouseleave: this.onAnchorMouseleave,
    }, this);

    this.windowEventHandler = Util.bindAll({
      click: this.onWindowClick,
      keydown: this.onWindowKeydown,
      keyup: this.onWindowKeyup,
    }, this);

    this.receiveEventHandler = Util.bindAll({
      updateTabStatus: this.onUpdateTabStatus,
      norifyRemoveTabs: this.onNorifyRemoveTabs,
    }, this);

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
    this.bindAllEvents();
  }

  /**
   * ポートオブジェクトの初期化
   *
   * @private
   * @param {string[]} methods メソッド
   */
  portInitialize(...methods) {
    methods.forEach((method) => {
      const port = this.chrome.extension.connect({name: method});

      delete this.ports[method];

      port.onDisconnect.addListener(() => {
        this.ports[method] = false;
      });

      this.ports[method] = port;
    });
  }

  /**
   * 全てのイベントをバインド
   *
   * @private
   */
  bindAllEvents() {
    Object.keys(this.windowEventHandler).forEach((e) => {
      this.window.removeEventListener(e, this.windowEventHandler[e]);
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
      this.window.addEventListener('click', this.windowEventHandler.click);
    }

    if (this.shortcutKeyTobbleEnabled.length > 0) {
      this.window.addEventListener('keydown', this.windowEventHandler.keydown);
      this.window.addEventListener('keyup', this.windowEventHandler.keyup);
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
        contextmenu: this.enabled,
        mousedown: this.enabled,
        mouseenter: this.enabled && this.isVisibleLinkState,
        mouseleave: this.enabled && this.isVisibleLinkState,
        mousemove: this.enabled && this.isVisibleLinkState,
      };
    }

    const nodes = Util.isArray(node) ? node : [node];

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
          let isNeedSetOriginHref = false;

          Object.keys(this.anchorEventHandler).forEach((ae) => {
            nd.removeEventListener(ae, this.anchorEventHandler[ae]);

            if (enabled[ae]) {
              nd.addEventListener(ae, this.anchorEventHandler[ae]);
              isNeedSetOriginHref = true;
            }

            if (nd.dataset.lbOpenNewTab) {
              delete nd.dataset.lbOpenNewTab;
            }
          });

          if (isNeedSetOriginHref) {
            if (!nd.dataset.lbOrigHref
              && nd.href
              && nd.href !== ''
            ) {
              nd.dataset.lbOrigHref = nd.href;
            }
          } else {
            delete nd.dataset.lbOrigHref;
          }
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
    return this.enabled
      && this.ports.openTab
      && this.window.opener === null;
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
      const parsed = Util.parseUrl(url);
      const isSameDomain = (parsed.domain === this.parsed.domain);

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

    const url = this.getUrlFromDOM(dom);
    return (url && this.isNeedOpenTabFromUrl(this.absPath(url)));
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
      this.isNeedOpenTabFromButton(e.button)
      && this.isNeedOpenTabFromEvent(e)
      && this.isNeedOpenTabFromDOM(this.getParentsNode(e.target, 'a'))
    );
  }

  /**
   * クリックボタンから別タブで開く必要があるか返却
   *
   * @private
   * @param {number} button マウスボタン番号(0: 左, 1: 中, 2: 右)
   * @return {boolean} 別タブで開く必要がある: true
   */
  isNeedOpenTabFromButton(button) {
    return (
      (button === 0 && this.isLeftClick)
      || (button === 1 && this.isMiddleClick)
      || (button === 2 && this.isRightClick)
    );
  }

  /**
   * 新しいタブを選択する必要があるか
   *
   * @private
   * @param {*} e イベント
   * @return {boolean} 新しいタブを選択する必要がある: true
   */
  isNeedNewTabSelect(e) {
    // バックグラウンドで開かない設定の場合
    // 又は、中クリックかつ中クリック設定が有効の場合
    return (
      !this.isBackground
      || (e.button === 1 && this.isMiddleClick)
    );
  }

  /**
   * DOMオブジェクトから開くべきURLを返却
   *
   * @param {Object} dom DOMオブジェクト
   * @return {boolean} 別タブで開く必要がある: true
   */
  getUrlFromDOM(dom) {
    if (dom.dataset.lbOrigHref) {
      return dom.dataset.lbOrigHref;
    } else if (dom.href) {
      return dom.href;
    }

    return '';
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
      const target = this.getParentsNode(e.target, 'a');

      if (target) {
        const url = this.getUrlFromDOM(target);

        return isFullUrl
          ? this.absPath(url)
          : url;
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

      const navb = this.window.document.createElement('div');
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
  onWindowClick(e) {
    if (this.navigation) {
      this.navigation.className = 'hide';
      this.navigation.style.display = 'none';
    }

    // multi clicks tab close.
    if (this.ports.removeTabs && e.detail === 3) {
      const align = (e.clientX > this.window.document.documentElement.clientWidth / 2) ? 'right' : 'left';

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

  /**
   * キーダウンイベントハンドラ
   *
   * @private
   * @param {Object} e イベント
   */
  onWindowKeydown(e) {
    this.setNavigationState(e);

    const keyCode = Number(e.keyCode);

    if (this.keys.indexOf(keyCode) === -1) {
      this.keys.push(keyCode);
    }

    if (this.keys.length === this.shortcutKeyTobbleEnabled.length) {
      let exist = true;

      for (const i in this.keys) {
        if (this.shortcutKeyTobbleEnabled.indexOf(this.keys[i]) === -1) {
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
  onWindowKeyup(e) {
    this.setNavigationState(e);
    this.keys = [];
  }

  /**
   * クリックイベントハンドラ
   *
   * @private
   * @param {Object} e イベント
   */
  onAnchorClick(e) {
    if (this.navigation) {
      this.navigation.className = 'hide';
      this.navigation.style.display = 'none';
    }

    const target = this.getParentsNode(e.target, 'a');

    if (!target) {
      return;
    }

    if (target.dataset.lbOpenNewTab) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.window.getSelection().collapse(this.window.document.body, 0);
      delete target.dataset.lbOpenNewTab;
    }
  }

  /**
   * コンテキストメニューイベントハンドラ
   *
   * @private
   * @param {Object} e イベント
   */
  onAnchorContextmenu(e) {
    this.onAnchorClick(e);
  }

  /**
   * マウスダウンイベントハンドラ
   *
   * @private
   * @param {Object} e イベント
   */
  onAnchorMousedown(e) {
    if (this.navigation) {
      this.navigation.className = 'hide';
      this.navigation.style.display = 'none';
    }

    const target = this.getParentsNode(e.target, 'a');

    if (!target) {
      return;
    }

    if (this.isNeedOpenTabFromSystemStatus()
      && this.isNeedOpenTabFromClickEvent(e)
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      target.dataset.lbOpenNewTab = true;

      const params = {
        url: this.getUrlFromClickEvent(e),
        selected: this.isNeedNewTabSelect(e),
      };

      this.ports.openTab.postMessage(params);
    }
  }

  /**
   * マウスエンターイベントハンドラ
   *
   * @private
   * @param {Object} e イベント
   */
  onAnchorMouseenter(e) {
    const target = this.getParentsNode(e.target, 'a');

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
  onAnchorMousemove(e) {
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
  onAnchorMouseleave(e) {
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

    const isNeedOpenTab = this.navigationTarget
      && this.isNeedOpenTabFromSystemStatus()
      && this.isNeedOpenTabFromEvent(e)
      && this.isNeedOpenTabFromDOM(this.navigationTarget);

    for (const target of this.navTargets) {
      for (const status of this.navStatuses) {
        const elem = this.window.document.getElementById(
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

    if ('isLeftClick' in response) {
      this.isLeftClick = Boolean(response.isLeftClick);
    }

    if ('isMiddleClick' in response) {
      this.isMiddleClick = Boolean(response.isMiddleClick);
    }

    if ('isRightClick' in response) {
      this.isRightClick = Boolean(response.isRightClick);
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
    this.bindAllEvents();
  }

  /**
   * タブの消去を通知
   *
   * @private
   * @param {Object} response レスポンス
   */
  onNorifyRemoveTabs(response) {
    const oldNotify = this.window.document.getElementById('linkblanker-notify');

    if (oldNotify) {
      oldNotify.hide(0);
    }

    const canvas = this.getCanvas(response);

    this.window.document.body.appendChild(canvas);

    const tabs = new Tabs(canvas);
    const align = response.align === 'left'
      ? tabs.REMOVE.RIGHT_TO_LEFT
      : tabs.REMOVE.LEFT_TO_RIGHT;

    tabs.show(response.removeTabsLength);

    setTimeout(() => {
      tabs.removeAll(align, (removed) => {
        canvas.setAttribute('class', 'hide');

        const notify = this.getNotify(response, removed);
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
   * キャンバスを返却
   *
   * @private
   * @param {Object} param パラメータ
   * @return {Object} キャンバス
   */
  getCanvas(param) {
    const canvas = this.window.document.createElement('canvas');
    const meta = this.getCloseActionMetaInfo(param);

    const styles = [
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
    const width = 300;
    const height = 300;
    let top = Math.floor(param.pageY) - Math.floor(height / 2);
    let left = Math.floor(param.pageX) - Math.floor(width / 2);
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;
    const docElem = this.window.document.documentElement;

    const viewport = {
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
    const notify = this.window.document.createElement('div');

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
    const e = this.window.document.createElement('div');
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
