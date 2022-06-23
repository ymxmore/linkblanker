import TabId from '@/domain/entity/tab/id';
import Id from '@/domain/entity/tabBundle/id';
import TabBundle from '@/domain/entity/tabBundle/tabBundle';
import Time from '@/domain/entity/tabBundle/time';

export default interface TabBundleRepository {
  generateId(): Promise<Id>;
  get(id: Id): Promise<TabBundle>;
  set(data: TabBundle): Promise<void>;
  list(from?: TabId, min?: Time): Promise<TabBundle[]>;
  delete(id: Id): Promise<void>;
  clean(max?: Time): Promise<void>;
}
