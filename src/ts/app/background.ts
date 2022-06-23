import browser, { Runtime } from 'webextension-polyfill';
import { ACTION } from '@/app/constants';
import inject from '@/app/di/background';
import LogService from '@/domain/service/logService';
import TabController from '@/interface/controller/tabController';
import TabCloseView from '@/interface/view/tab/tabCloseView';
import TabGetView from '@/interface/view/tab/tabGetView';

declare type OnInstalledDetailsType = Runtime.OnInstalledDetailsType;

const tabGetView: TabGetView = (data) => {
  browser.tabs
    .sendMessage(data.tab.id, {
      action: ACTION.GET_TAB,
      data,
    })
    .catch((e) => {
      logger.error(e);
    });
};

const tabCloseView: TabCloseView = (data) => {
  if (!data?.from) {
    return;
  }

  browser.tabs
    .sendMessage(data.from, {
      action: ACTION.CLOSE_TABS,
      data,
    })
    .catch((e) => {
      logger.error(e);
    });
};

const container = inject(browser, tabGetView, tabCloseView);

const logger = container.resolve<LogService>('LogService');

const tabController = container.resolve<TabController>('TabController');

const runtimeInstalledListener = (details: OnInstalledDetailsType) => {
  logger.debug('runtimeInstalledListener', details);
  sync();
};

const get = (id?: number) => {
  if (!id) {
    throw new Error('タブIDが特定出来ません。');
  }

  tabController.get(id);
};

const close = (tabId: number, direction: number) => {
  if (!tabId) {
    throw new Error('タブIDが指定されていません。');
  }

  if (!direction) {
    throw new Error('方向が指定されていません。');
  }

  tabController.close(tabId, direction);
};

const open = (from?: number, url?: string) => {
  if (!from) {
    throw new Error('開く元となるタブIDが特定出来ません。');
  }

  if (!url) {
    throw new Error('開く対象のURLが特定出来ません。');
  }

  tabController.open(from, url);
};

const sync = (id?: number) => {
  tabController.sync(id);
};

const runtimeMessageListener = (message, sender) => {
  switch (message?.action) {
    case ACTION.GET_TAB:
      get(sender?.tab?.id);
      break;
    case ACTION.SYNC_TAB:
      sync(sender?.tab?.id);
      break;
    case ACTION.OPEN_TAB:
      open(sender?.tab?.id, message?.url);
      break;
    case ACTION.CLOSE_TABS:
      close(sender?.tab?.id, message?.direction);
      break;
    default:
      break;
  }
};

const tabsUpdatedListener = (tabId: number) => {
  logger.debug('tabUpdatedListener', tabId);
  sync(tabId);
};

browser.runtime.onInstalled.addListener(runtimeInstalledListener);
browser.runtime.onMessage.addListener(runtimeMessageListener);
browser.tabs.onUpdated.addListener(tabsUpdatedListener);
