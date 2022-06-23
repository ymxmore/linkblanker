import Version from '@/domain/entity/preference/version';
import Index from '@/domain/entity/tab';
import Active from '@/domain/entity/tab/active';
import Id from '@/domain/entity/tab/id';
import Pinned from '@/domain/entity/tab/pinned';
import Tab from '@/domain/entity/tab/tab';
import Direction from '@/domain/entity/tabBundle/direction';
import Url from '@/domain/entity/url/url';
import WindowId from '@/domain/entity/window/id';

export default interface TabService {
  close(tabs: Tab): Promise<void>;
  findByDirection(
    fromTab: Tab,
    direction: Direction,
    pinned: Pinned,
  ): Promise<Tab[]>;
  get(id?: Id): Promise<Tab>;
  getAll(): Promise<Tab[]>;
  list(id: WindowId): Promise<Tab[]>;
  open(url: Url, index: Index, active: Active, pinned: Pinned): Promise<Tab>;
  undo(): Promise<Tab[]>;
  action(id: Id, enabled: boolean, version: Version): Promise<void>;
}
