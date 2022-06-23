import browser from 'webextension-polyfill';
import { ACTION } from '@/app/constants';
import inject from '@/app/di/inject';
import LogService from '@/domain/service/logService';
import AppPreferenceService from '@/interface/service/appPreferenceService';
import TabCloseViewModel, {
  DIRECTION,
} from '@/interface/viewmodel/tab/tabCloseViewModel';
import TabGetViewModel from '@/interface/viewmodel/tab/tabGetViewModel';

const container = inject(browser);

const logger = container.resolve<LogService>('LogService');

const appPreferenceService = container.resolve<AppPreferenceService>(
  'AppPreferenceService',
);

let tabGetViewModel: TabGetViewModel = null;

const BIND_NODE_TYPES = [Node.DOCUMENT_NODE, Node.ELEMENT_NODE];

const BIND_ANCHOR_EVENT_TYPES = ['click', 'contextmenu', 'mousedown'];

const NOTIFY_CONTAINER_STYLE = {
  position: 'fixed',
  top: '0',
  right: '0',
  zIndex: '999999',
  border: '0',
  boxShadow: 'none',
  overflow: 'hidden',
  backgroundColor: 'transparent',
  colorScheme: 'light',
};

const mutationObserver = new MutationObserver((mrs: MutationRecord[]) => {
  mrs.forEach((mr) => {
    applyAnchorClickEvents(Array.prototype.slice.call(mr.removedNodes), false);
    applyAnchorClickEvents(Array.prototype.slice.call(mr.addedNodes), true);
  });
});

const start = () => {
  browser.runtime.onMessage.addListener(onMessage);
  fetch();
};

const fetch = () => {
  browser.runtime
    .sendMessage({
      action: ACTION.SYNC_TAB,
    })
    .catch((e) => {
      logger.error(e);
    });

  browser.runtime
    .sendMessage({
      action: ACTION.GET_TAB,
    })
    .catch((e) => {
      logger.error(e);
    });
};

const observe = () => {
  mutationObserver.observe(window.document, {
    attributes: true,
    attributeFilter: ['href'],
    childList: true,
    subtree: true,
  });
};

const disconnect = () => {
  mutationObserver.disconnect();
};

const applyAnchorClickEvents = (nodes: Node[], enabled: boolean) => {
  nodes.forEach((item) => {
    if (
      !item ||
      BIND_NODE_TYPES.indexOf(item.nodeType) === -1 ||
      !item.nodeName
    ) {
      return;
    }

    if (item.nodeName.toLowerCase() === 'a') {
      BIND_ANCHOR_EVENT_TYPES.forEach((et) => {
        item.removeEventListener(et, onAnchorClick);
      });

      if (enabled) {
        BIND_ANCHOR_EVENT_TYPES.forEach((et) => {
          item.addEventListener(et, onAnchorClick);
        });
      }
    } else if (item instanceof Element || item instanceof Document) {
      applyAnchorClickEvents(
        Array.prototype.slice.call(item.getElementsByTagName('a')),
        enabled,
      );
    }
  });
};

const applyWindowClickEvents = (enabled: boolean) => {
  window.removeEventListener('click', onWindowClick);

  if (enabled) {
    window.addEventListener('click', onWindowClick);
  }
};

const update = (vm?: TabGetViewModel) => {
  if (!vm) {
    return;
  }

  tabGetViewModel = vm;

  const docs = [window.document];

  applyAnchorClickEvents(docs, true);
  applyWindowClickEvents(true);
  disconnect();
  observe();

  logger.debug('update', vm);
};

const onMessage = (message) => {
  switch (message.action) {
    case ACTION.GET_TAB: {
      if (!message?.data) {
        break;
      }

      update(message?.data);
      break;
    }
    case ACTION.UPDATE_TAB: {
      fetch();
      break;
    }
    case ACTION.CLOSE_TABS: {
      if (!message?.data) {
        break;
      }

      notify(message.data);
      break;
    }
    case ACTION.UPDATE_NOTIFY_CONTAINER: {
      const container = window.document.getElementById(
        getContainerId(getExtensionId()),
      );

      if (!container || !message?.data?.width || !message?.data?.height) {
        break;
      }

      container.style.width = `${message.data.width}px`;
      container.style.height = `${message.data.height}px`;
      break;
    }
    case ACTION.DELETE_NOTIFY_CONTAINER: {
      const container = window.document.getElementById(
        getContainerId(getExtensionId()),
      );

      if (!container) {
        break;
      }

      container.remove();
      break;
    }
    default: {
      break;
    }
  }
};

const onAnchorClick = (e: MouseEvent) => {
  const vm = tabGetViewModel;

  if (!vm) {
    return true;
  }

  const { tab, preference } = vm;
  const target = getParentsNode(e.target as Element, 'a');

  if (!target) {
    return true;
  }

  const to = getAbsPath(target);

  const shouldOpenTab = appPreferenceService.shouldOpenTab(
    tab.url.href,
    to,
    preference.enabledExtension,
    preference.disabledDomain,
    preference.disabledDirectory,
    preference.disabledPage,
    preference.disabledOn,
    preference.disabledSameDomain,
    preference.clickPosition,
    hasOnClick(target),
    e.type,
    e.button,
  );

  if (!shouldOpenTab) {
    // リンクを別タブで開かない
    return true;
  }

  browser.runtime
    .sendMessage({
      action: ACTION.OPEN_TAB,
      url: to,
    })
    .catch((e) => {
      logger.error(e);
    });

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  return false;
};

const onWindowClick = (e: MouseEvent) => {
  const vm = tabGetViewModel;

  if (!vm) {
    return true;
  }

  const target = getParentsNode(e.target as Element, 'a');

  if (target) {
    // aタグはウィンドウクリックとみなさない
    return true;
  }

  const { preference } = vm;

  const shouldMulticlickClose = appPreferenceService.shouldMulticlickClose(
    preference.enabledExtension,
    preference.enabledMulticlickClose,
    e.detail,
  );

  if (!shouldMulticlickClose) {
    // 閉じない
    return true;
  }

  const direction =
    e.clientX > window.document.documentElement.clientWidth / 2
      ? DIRECTION.RIGHT
      : DIRECTION.LEFT;

  window.getSelection().collapse(window.document.body, 0);

  browser.runtime
    .sendMessage({
      action: ACTION.CLOSE_TABS,
      direction,
    })
    .catch((e) => {
      logger.error(e);
    });

  return false;
};

const notify = (data?: TabCloseViewModel) => {
  browser.runtime
    .sendMessage({
      action: ACTION.NOTIFY_CLOSE_TABS,
      data,
    })
    .catch((e) => {
      logger.error(e);
    });

  if (location.href !== tabGetViewModel.tab.url.href) {
    // iframeの場合は通知を出さない
    // タブのURLと一致するかで判定
    return;
  }

  const extId = getExtensionId();
  const containerId = getContainerId(extId);

  if (window.document.getElementById(containerId)) {
    // 通知コンテナがあれば何もしない
    return;
  }

  const container = window.document.createElement('iframe');
  container.setAttribute('id', containerId);
  container.setAttribute(
    'src',
    `chrome-extension://${extId}/html/notify-close-tabs.html?id=${data.from}`,
  );

  Object.keys(NOTIFY_CONTAINER_STYLE).forEach((name) => {
    container.style[name] = NOTIFY_CONTAINER_STYLE[name] as string;
  });

  window.document.head.after(container);
};

const getExtensionId = () => browser.i18n.getMessage('@@extension_id');
const getContainerId = (extId: string) => `${extId}-notify`;

/**
 * 親ノードを返却
 *
 * @param node ノード
 * @param target 対象のID or Class or タグ
 * @return 親ノード
 */
const getParentsNode = (node: any, target: string): Node | boolean => {
  if (!node || !target || !(node instanceof Element)) {
    return false;
  }

  let rexp: RegExp = null;
  let prop: string = null;

  const tgt = target.trim().toLowerCase();

  if (/^#/.test(tgt)) {
    // id
    rexp = new RegExp(`^${tgt.slice(1).toLowerCase()}$`);
    prop = (node.id || '').trim().toLowerCase();
  } else if (/^\./.test(tgt)) {
    // class
    rexp = new RegExp(`(^| )${tgt.slice(1).toLowerCase()}($| )`);
    prop = (node.className || '').trim().toLowerCase();
  } else {
    // tag
    rexp = new RegExp(`^${tgt}$`);
    prop = node.nodeName.toLowerCase();
  }

  if (prop !== '' && rexp.test(prop)) {
    return node;
  } else if (node.parentNode) {
    return getParentsNode(node.parentNode as Element, target);
  }

  return false;
};

/**
 * パスをフルURLにして返却
 *
 * @param path パス、またはノード
 * @return フルURL
 */
const getAbsPath = (path: any): string => {
  if (!(path instanceof String) && !(path instanceof HTMLAnchorElement)) {
    throw new Error('型が不正です。');
  }

  const pth = path instanceof HTMLAnchorElement ? path.href : path;
  const e = window.document.createElement('div');
  e.innerHTML = `<a href="${pth}"/>`;
  return (e.firstChild as HTMLAnchorElement).href;
};

/**
 * 指定されたノードがonclick属性を持っているか
 *
 * @param node ノード
 * @returns 結果
 */
const hasOnClick = (node: any): boolean => {
  return node instanceof Notification && !!node.onclick;
};

start();
