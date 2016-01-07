/*
 * libs/Agent.js
 */

import Tabs from './Tabs';
import Util from './Util';
import Logger from './Logger';

const ANCHOR_EVENTS = [
  'click',
  'mouseenter',
  'mouseleave',
  'mousemove'
];

export default class Agent {
  constructor(window, chrome) {
    this.window = window;
    this.chrome = chrome;
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
    this.events = {};
    this.receiveMessages = {};
    this.navigation = null;
    this.navigationTarget = null;
    this.mutationObserver = null;
    this.bindNodeTypes = [];
    this.initialize();
  }

  initialize() {
    this.bindNodeTypes = [
      this.window.Node.DOCUMENT_NODE,
      this.window.Node.ELEMENT_NODE
    ];

    this.events = this.getEvents();
    this.receiveMessages = this.getReceiveMessages();

    this.chrome.extension.onMessage.addListener((response, sender) => {
      if ('name' in response &&
        response.name in this.receiveMessages &&
        'function' === typeof this.receiveMessages[response.name]) {
        // call receiver
        this.receiveMessages[response.name](response);
      }
    });

    this.portInitialize('openTab', 'undoRemoveTabs', 'removeTabs', 'toggleEnabled');

    this.window.document.addEventListener('DOMContentLoaded', this.onCompleted.bind(this));
    this.window.addEventListener('load', this.onCompleted.bind(this));
  }

  onCompleted(e) {
    if (this.domContentLoaded) {
      return;
    }

    this.domContentLoaded = true;

    this.setNavigation();
    this.bindEvents();
  }

  portInitialize(...methods) {
    methods.forEach((method) => {
      let port = this.chrome.extension.connect({ name: method });

      delete this.ports[method];

      port.onDisconnect.addListener(() => {
        this.ports[method] = false;
      });

      this.ports[method] = port;
    });
  }

  bindEvents() {
    for (let e in this.events) {
      this.window.removeEventListener(e, this.events[e]);
    }

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
            mousemove: false
          });
          this.bindAnchorEvents(Array.prototype.slice.call(mr.addedNodes));
        });
      });

      this.mutationObserver.observe(this.window.document, {
        childList: true,
        subtree: true
      });
    }

    if (this.multiClickClose) {
      this.window.addEventListener('click', this.events.click);
    }

    if (this.shortcutKeyTobbleEnabled.length > 0) {
      this.window.addEventListener('keydown', this.events.keydown);
      this.window.addEventListener('keyup', this.events.keyup);
    }
  }

  bindAnchorEvents(node, enabled) {
    if ('undefined' === typeof enabled) {
      enabled = {
        click: this.enabled,
        mouseenter: this.enabled && this.isVisibleLinkState,
        mouseleave: this.enabled && this.isVisibleLinkState,
        mousemove: this.enabled && this.isVisibleLinkState
      };
    }

    let nodes = Util.isArray(node) ? node : [node];

    nodes.forEach((nd) => {
      if (nd && this.bindNodeTypes.indexOf(nd.nodeType) > -1 && nd.nodeName) {
        if ('a' !== nd.nodeName.toLowerCase()) {
          this.bindAnchorEvents(Array.prototype.slice.call(nd.getElementsByTagName('a')), enabled);
        } else {
          ANCHOR_EVENTS.forEach((ae) => {
            nd.removeEventListener(ae, this.events[ae]);

            if (enabled[ae]) {
              nd.addEventListener(ae, this.events[ae]);
            }
          });
        }
      }
    });
  }

  isNeedOpenTabFromSystemStatus() {
    return this.enabled && this.ports.openTab;
  }

  isNeedOpenTabFromUrl(url) {
    if (url && !url.match(/javascript:/i)) {
      let parsed = Util.parseUrl(url);
      let isSameDomain = (parsed.domain === this.parsed.domain);

      if ((isSameDomain && '' !== parsed.hash) || (this.disabledSameDomain && isSameDomain)) {
        return false;
      }

      return true;
    }

    return false;
  }

  isNeedOpenTabFromDOM(dom) {
    if (!dom) {
      return false;
    }

    return (
      dom &&
      !dom.onclick &&
      dom.href &&
      this.isNeedOpenTabFromUrl(this.absPath(dom.href))
    );
  }

  isNeedOpenTabFromEvent(e) {
    if (!e) {
      return true;
    }

    return (
      !e.ctrlKey &&
      !e.metaKey &&
      !e.shiftKey &&
      !e.defaultPrevented
    );
  }

  isNeedOpenTabFromClickEvent(e) {
    if (!e) {
      return false;
    }

    return (
      0 === e.button &&
      this.isNeedOpenTabFromEvent(e) &&
      this.isNeedOpenTabFromDOM(this.getParentsNode(e.target, 'a'))
    );
  }

  getUrlFromClickEvent(e, isFullUrl) {
    if (e && e.target) {
      let target = this.getParentsNode(e.target, 'a');

      if (target && target.href) {
        return isFullUrl ? this.absPath(target.href) : target.href;
      }
    }

    return null;
  }

  setNavigation() {
    let navc = this.window.document.createElement('div');
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
  }

  getEvents() {
    let events = {
      click: (e) => {
        let target = this.getParentsNode(e.target, 'a');

        if (target) {
          if (this.isNeedOpenTabFromSystemStatus() &&
            this.isNeedOpenTabFromClickEvent(e)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            let params = {
              url: this.getUrlFromClickEvent(e),
              selected: !this.isBackground
            };

            this.ports.openTab.postMessage(params);

            return false;
          }
        } else if (this.multiClickClose) {
          // multi clicks tab close.
          if (this.ports.removeTabs && 3 === e.detail) {
            let align = (e.clientX > this.window.document.documentElement.clientWidth / 2) ? 'right' : 'left';

            this.ports.removeTabs.postMessage({
              align: align,
              clientX: e.clientX,
              clientY: e.clientY,
              pageX: e.pageX,
              pageY: e.pageY
            });

            this.window.getSelection().collapse(this.window.document.body, 0);
          }
        }
      },
      keydown: (e) => {
        this.setNavigationState(e);

        let keyCode = Number(e.keyCode);

        if (-1 === this.keys.indexOf(keyCode)) {
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
      },
      keyup: (e) => {
        this.setNavigationState(e);
        this.keys = [];
      },

      mouseenter: (e) => {
        let target = this.getParentsNode(e.target, 'a');

        if (target) {
          this.navigationTarget = target;
          this.setNavigationState(e);
          this.navigation.className = 'show';
          this.navigation.style.display = 'block';
        }

      },
      mousemove: (e) => {
        if ('show' === this.navigation.className) {
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
      },
      mouseleave: (e) => {
        this.navigationTarget = null;

        setTimeout(() => {
          if (null === this.navigationTarget) {
            this.navigation.className = 'hide';

            setTimeout(() => {
              if (null === this.navigationTarget) {
                this.navigation.style.display = 'none';
              }
            }, 110);
          }
        }, 20);
      }
    };

    Object.keys(events).forEach((event) => {
      events[event] = events[event].bind(this);
    });

    return events;
  }

  setNavigationState(e) {
    let isNeedOpenTab = this.navigationTarget &&
      this.isNeedOpenTabFromSystemStatus() &&
      this.isNeedOpenTabFromEvent(e) &&
      this.isNeedOpenTabFromDOM(this.navigationTarget);

    let showIcon = this.window.document.getElementById(`linkblanker-status-icon-${isNeedOpenTab ? 'enabled' : 'disabled'}`);
    let hideIcon = this.window.document.getElementById(`linkblanker-status-icon-${isNeedOpenTab ? 'disabled' : 'enabled'}`);
    let onText = this.window.document.getElementById(`linkblanker-status-text-${isNeedOpenTab ? 'enabled' : 'disabled'}`);
    let offText = this.window.document.getElementById(`linkblanker-status-text-${isNeedOpenTab ? 'disabled' : 'enabled'}`);

    showIcon.style.display = 'block';
    hideIcon.style.display = 'none';
    onText.style.display = 'block';
    offText.style.display = 'none';
  }

  getReceiveMessages() {
    let receiveMessages = {
      updateTabStatus: (response) => {
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

        this.bindEvents();
      },

      norifyRemoveTabs: (response) => {
        let oldNotify = this.window.document.getElementById('linkblanker-notify');

        if (oldNotify) {
          oldNotify.hide(0);
        }

        let canvas = this.getCanvas(response);

        this.window.document.body.appendChild(canvas);

        let tabs = new Tabs(canvas);
        let align = 'left' === response.align ? tabs.REMOVE.RIGHT_TO_LEFT : tabs.REMOVE.LEFT_TO_RIGHT;

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
    };

    Object.keys(receiveMessages).forEach((receiveMessage) => {
      receiveMessages[receiveMessage] = receiveMessages[receiveMessage].bind(this);
    });

    return receiveMessages;
  }

  getCanvas(info) {
    let canvas = this.window.document.createElement('canvas');
    let meta = this.getCloseActionMetaInfo(info);

    let styles = [
      `top:${meta.top}px`,
      `left:${meta.left}px`,
      `width:${meta.width}px`,
      `height:${meta.height}px`,
      `border-radius:${Math.floor(meta.width / 2)}px`
    ];

    canvas.setAttribute('id', 'linkblanker-canvas');
    canvas.setAttribute('class', 'show');
    canvas.setAttribute('width', meta.width);
    canvas.setAttribute('height', meta.height);
    canvas.setAttribute('style', styles.join(';') + ';');

    return canvas;
  }

  getWait(info) {
    let wait = (50 * info.removeTabsLength);

    if (wait < 300) {
      wait = 300;
    } else if (wait > 500) {
      wait = 500;
    }

    return wait;
  }

  getCloseActionMetaInfo(info) {
    let width = 300;
    let height = 300;
    let top = Math.floor(info.pageY) - Math.floor(height / 2);
    let left = Math.floor(info.pageX) - Math.floor(width / 2);
    let scrollTop = window.scrollY;
    let scrollLeft = window.scrollX;

    let viewport = {
      top: scrollTop,
      right: scrollLeft + this.window.document.documentElement.clientWidth,
      bottom: scrollTop + this.window.document.documentElement.clientHeight,
      left: scrollLeft
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
      left
    };
  }

  getNotify(info, length) {
    let notify = this.window.document.createElement('div');

    notify.innerHTML = `
      <img class="linkblanker-icon" src="${this.chrome.extension.getURL('img/icon-enabled.svgz')}" />
      <p class="linkblanker-message">
      ${this.chrome.i18n.getMessage('message_drop_tabs')
        .replace(
          "{REMOVE_TAB_ALIGN}",
          'left' === info.align ?
            this.chrome.i18n.getMessage('title_left') :
            this.chrome.i18n.getMessage('title_right')
        )
        .replace("{REMOVE_TAB_LENGTH}", info.removeTabsLength)}
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
      if ('object' === typeof e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      } else {
        time = e;
      }

      if (notify) {
        notify.getElementsByClassName('linkblanker-notify-remove')[0].removeEventListener('click', notify.hide);
        notify.setAttribute('class', 'hide');

        setTimeout(() => {
          if (notify && notify.parentNode) {
            notify.parentNode.removeChild(notify);
          }
        }, 'undefined' === typeof time ? 500 : time);
      }
    };

    notify.undo = (e) => {
      if ('object' === typeof e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }

      notify.getElementsByClassName('linkblanker-undo')[0].removeEventListener('click', notify.undo);
      notify.hide();

      if (this.ports.undoRemoveTabs) {
        this.ports.undoRemoveTabs.postMessage();
      }
    };

    notify.getElementsByClassName('linkblanker-undo')[0].addEventListener('click', notify.undo);
    notify.getElementsByClassName('linkblanker-notify-remove')[0].addEventListener('click', notify.hide);

    return notify;
  }

  absPath(path) {
    let e = this.window.document.createElement('div');
    e.innerHTML = `<a href="${path}"/>`;
    return e.firstChild.href;
  }

  getParentsNode(node, tag, normalized) {
    if (!node || !tag) {
      return false;
    }

    if (!normalized) {
      tag = (tag || '').toLowerCase();
    }

    if (tag === node.nodeName.toLowerCase()) {
      return node;
    } else if (node.parentNode) {
      return this.getParentsNode(node.parentNode, tag, true);
    }

    return false;
  }
}
