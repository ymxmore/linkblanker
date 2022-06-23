import { Browser, Tabs, Windows } from 'webextension-polyfill';
import Version from '@/domain/entity/preference/version';
import Index from '@/domain/entity/tab';
import Active from '@/domain/entity/tab/active';
import Id from '@/domain/entity/tab/id';
import Pinned from '@/domain/entity/tab/pinned';
import Status from '@/domain/entity/tab/status';
import Tab from '@/domain/entity/tab/tab';
import Title from '@/domain/entity/tab/title';
import Direction, { DIRECTION } from '@/domain/entity/tabBundle/direction';
import Url from '@/domain/entity/url/url';
import WindowId from '@/domain/entity/window/id';
import TabService from '@/domain/service/tabService';
import { compareVersion } from '@/helper';

export default class BrowserTabService implements TabService {
  constructor(private readonly browser: Browser) {}

  close(tab: Tab): Promise<void> {
    return this.browser.tabs.remove(tab.id.value);
  }

  async findByDirection(
    fromTab: Tab,
    direction: Direction,
    pinned: Pinned,
  ): Promise<Tab[]> {
    const tabs = await this.list(fromTab.windowId);

    tabs.sort((a, b) => {
      if (a.index.value < b.index.value) {
        return direction.value === DIRECTION.RIGHT ? -1 : 1;
      }

      if (a.index.value > b.index.value) {
        return direction.value === DIRECTION.RIGHT ? 1 : -1;
      }

      return 0;
    });

    const rtabs: Tab[] = [];
    let aid = -1;

    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].active.value) {
        aid = tabs[i].id.value;
        continue;
      }

      // 固定タブは閉じない=ONの場合は固定タブは除外
      if (pinned.value && tabs[i].pinned.value) {
        continue;
      }

      if (aid > -1) {
        rtabs.push(tabs[i]);
      }
    }

    return Promise.all(rtabs);
  }

  async get(id?: Id): Promise<Tab> {
    let tab: Tabs.Tab | null = null;

    if (id) {
      tab = await this.browser.tabs.get(id.value);
    } else {
      tab = this.findActiveTab(
        [await this.browser.windows.getLastFocused({ populate: true })],
        false,
      );

      if (!tab) {
        tab = this.findActiveTab(
          await this.browser.windows.getAll(this.getWindowQuery()),
          true,
        );
      }
    }

    if (!tab) {
      throw new Error('タブが見つかりませんででした。');
    }

    return Tab.of({
      active: Active.of(tab.active),
      id: Id.of(tab.id),
      index: Index.of(tab.index),
      pinned: Pinned.of(tab.pinned),
      status: Status.of(tab.status),
      title: Title.of(tab.title),
      url: Url.href(tab.url),
      windowId: WindowId.of(tab.windowId),
    });
  }

  async getAll(): Promise<Tab[]> {
    return (await this.browser.windows.getAll(this.getWindowQuery())).reduce(
      (tabs, w) => {
        const ts: Tab[] =
          w.tabs?.map((item) => {
            return Tab.of({
              active: Active.of(item.active),
              id: Id.of(item.id),
              index: Index.of(item.index),
              pinned: Pinned.of(item.pinned),
              status: Status.of(item.status),
              title: Title.of(item.title),
              url: Url.href(item.url),
              windowId: WindowId.of(item.windowId),
            });
          }) || [];

        return tabs.concat(ts);
      },
      [] as Tab[],
    );
  }

  async list(windowId: WindowId): Promise<Tab[]> {
    const tabs = await this.browser.tabs.query({ windowId: windowId.value });

    return tabs.map((item) =>
      Tab.of({
        active: Active.of(item.active),
        id: Id.of(item.id),
        index: Index.of(item.index),
        pinned: Pinned.of(item.pinned),
        status: Status.of(item.status),
        title: Title.of(item.title),
        url: Url.href(item.url || item.pendingUrl),
        windowId: WindowId.of(item.windowId),
      }),
    );
  }

  async open(
    url: Url,
    index: Index,
    active: Active,
    pinned: Pinned,
  ): Promise<Tab> {
    const to = await this.browser.tabs.create({
      url: url.href.value,
      index: index.value,
      active: active.value,
      pinned: pinned.value,
    });

    return Tab.of({
      active: Active.of(to.active),
      id: Id.of(to.id),
      index: Index.of(to.index),
      pinned: Pinned.of(to.pinned),
      status: Status.of(to.status),
      title: Title.of(to.title),
      url: Url.href(to.url || to.pendingUrl || url.href.value),
      windowId: WindowId.of(to.windowId),
    });
  }

  undo(): Promise<Tab[]> {
    throw new Error('Method not implemented.');
  }

  async action(id: Id, enabled: boolean, version: Version): Promise<void> {
    const text =
      version && compareVersion('3.0.0', version.value) > 0
        ? 'NEW'
        : enabled
        ? ' ON '
        : 'OFF';

    const backgroundColor =
      version && compareVersion('3.0.0', version.value) > 0
        ? '#f48fb1'
        : enabled
        ? '#80deea'
        : '#bdbdbd';

    const path = '/img/icon32' + (enabled ? '' : '-disabled') + '.png';

    await Promise.all([
      this.browser.action.setIcon({
        path,
        tabId: id.value,
      }),
      this.browser.action.setBadgeText({
        text,
        tabId: id.value,
      }),
      this.browser.action.setBadgeBackgroundColor({
        color: backgroundColor,
        tabId: id.value,
      }),
    ]);
  }

  private findActiveTab(
    windows: Windows.Window[],
    focused: boolean,
  ): Tabs.Tab | null {
    for (let i = 0; i < windows.length; i++) {
      if (!focused || windows[i].focused) {
        for (let j = 0; j < windows[i].tabs?.length || 0; j++) {
          if (windows[i].tabs[j].active) {
            return windows[i].tabs[j];
          }
        }
      }
    }

    return null;
  }

  private getWindowQuery(): Windows.GetAllGetInfoType {
    return {
      populate: true,
      windowTypes: ['normal'],
    };
  }
}
