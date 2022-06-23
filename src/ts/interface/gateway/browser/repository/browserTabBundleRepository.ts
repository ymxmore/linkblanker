import { Storage } from 'webextension-polyfill';
import TabId from '@/domain/entity/tab/id';
import Pinned from '@/domain/entity/tab/pinned';
import Direction from '@/domain/entity/tabBundle/direction';
import Id from '@/domain/entity/tabBundle/id';
import TabBundle from '@/domain/entity/tabBundle/tabBundle';
import Time from '@/domain/entity/tabBundle/time';
import Url from '@/domain/entity/url/url';
import TabBundleRepository from '@/domain/repository/tabBundleRepository';
import LogService from '@/domain/service/logService';

const KEY = {
  ID: 'tabBundleId',
  DATA: 'tabBundleData',
} as const;

interface Props {
  readonly id: number;
  readonly from: number;
  readonly direction: number;
  readonly time: number;
  readonly tabs: Array<{
    readonly pinned: boolean;
    readonly url: string;
  }>;
}

export default class BrowserTabBundleRepository implements TabBundleRepository {
  constructor(
    private storage: Storage.StorageArea,
    private readonly logger: LogService,
  ) {}

  async generateId(): Promise<Id> {
    let o = '0';

    try {
      const data = await this.storage.get(KEY.ID);

      if (KEY.ID in data) {
        o = JSON.parse(data[KEY.ID]) as string;
      }
    } catch (e) {
      this.logger.debug(e);
    }

    const n = Number(o) + 1;
    await this.storage.set({ [KEY.ID]: JSON.stringify(n) });
    return Id.of(n);
  }

  async get(id: Id): Promise<TabBundle> {
    const list = await this.list();

    for (let i = 0; i < list.length; i++) {
      if (list[i].id.value === id.value) {
        return list[i];
      }
    }

    throw new Error('指定されたIDのタブ束は存在しません。');
  }

  async set(data: TabBundle): Promise<void> {
    const list = await this.list();
    list.unshift(data);
    await this.storage.set({ [KEY.DATA]: JSON.stringify(list) });
  }

  async list(from?: TabId, min?: Time): Promise<TabBundle[]> {
    let list: TabBundle[] = [];

    try {
      const data = await this.storage.get(KEY.DATA);

      if (!(KEY.DATA in data)) {
        return list;
      }

      list = (JSON.parse(data[KEY.DATA]) as Props[]).map((item) => {
        return TabBundle.of({
          id: Id.of(item.id),
          from: TabId.of(item.from),
          direction: Direction.of(item.direction),
          time: Time.of(item.time),
          tabs: item.tabs.map((tab) => ({
            pinned: Pinned.of(tab.pinned),
            url: Url.href(tab.url),
          })),
        });
      });
    } catch (e) {
      this.logger.debug(e);
      return list;
    }

    if (min) {
      list = list.filter((item) => item.time.value >= min.value);
    }

    if (!from) {
      return list;
    }

    list = list.filter((item) => item.from.value === from.value);

    return list;
  }

  async delete(id: Id): Promise<void> {
    const list = await this.list();

    let found = -1;

    for (let i = 0; i < list.length; i++) {
      if (list[i].id.value === id.value) {
        found = i;
      }
    }

    if (found === -1) {
      return;
    }

    list.splice(found, 1);

    await this.storage.set({ [KEY.DATA]: JSON.stringify(list) });
  }

  async clean(max: Time): Promise<void> {
    const list = (await this.list()).filter(
      (item) => item.time.value >= max.value,
    );
    await this.storage.set({ [KEY.DATA]: JSON.stringify(list) });
  }
}
