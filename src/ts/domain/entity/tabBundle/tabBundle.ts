import TabId from '@/domain/entity/tab/id';
import Pinned from '@/domain/entity/tab/pinned';
import Direction from '@/domain/entity/tabBundle/direction';
import Id from '@/domain/entity/tabBundle/id';
import Time from '@/domain/entity/tabBundle/time';
import Url from '@/domain/entity/url/url';
import ValueObject from '@/domain/entity/valueObject';

interface TabBundleProps {
  readonly id: Id;
  readonly from: TabId;
  readonly direction: Direction;
  readonly time: Time;
  readonly tabs: Array<{
    readonly pinned: Pinned;
    readonly url: Url;
  }>;
}

export default class TabBundle extends ValueObject<TabBundleProps> {
  static of(props: TabBundleProps): TabBundle {
    return new TabBundle(props);
  }

  get id(): Id {
    return this.value.id;
  }

  get from(): TabId {
    return this.value.from;
  }

  get direction(): Direction {
    return this.value.direction;
  }

  get time(): Time {
    return this.value.time;
  }

  get tabs(): Array<{
    readonly pinned: Pinned;
    readonly url: Url;
  }> {
    return this.value.tabs;
  }
}
