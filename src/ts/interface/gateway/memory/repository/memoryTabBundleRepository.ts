import TabId from '@/domain/entity/tab/id';
import Id from '@/domain/entity/tabBundle/id';
import TabBundle from '@/domain/entity/tabBundle/tabBundle';
import Time from '@/domain/entity/tabBundle/time';
import TabBundleRepository from '@/domain/repository/tabBundleRepository';

export default class MemoryTabBundleRepository implements TabBundleRepository {
  private generatedId = 0;
  private data: TabBundle[] = [];

  generateId(): Promise<Id> {
    return Promise.resolve(Id.of(++this.generatedId));
  }

  get(id: Id): Promise<TabBundle> {
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i].id.value === id.value) {
        return Promise.resolve(this.data[i]);
      }
    }

    throw new Error('指定されたIDのタブ束は存在しません。');
  }

  set(data: TabBundle): Promise<void> {
    this.data.unshift(data);
    return Promise.resolve();
  }

  list(from?: TabId, min?: Time): Promise<TabBundle[]> {
    let list = this.data;

    if (min) {
      list = list.filter((item) => item.time.value >= min.value);
    }

    if (!from) {
      return Promise.resolve(list);
    }

    list = list.filter((item) => item.from.value === from.value);

    return Promise.resolve(list);
  }

  delete(id: Id): Promise<void> {
    let found = -1;

    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i].id.value === id.value) {
        found = i;
      }
    }

    if (found > -1) {
      this.data.splice(found, 1);
    }

    return Promise.resolve();
  }

  clean(max: Time): Promise<void> {
    this.data = this.data.filter((item) => item.time.value >= max.value);
    return Promise.resolve();
  }
}
