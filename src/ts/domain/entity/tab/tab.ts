import Active from '@/domain/entity/tab/active';
import Id from '@/domain/entity/tab/id';
import Index from '@/domain/entity/tab/index';
import Pinned from '@/domain/entity/tab/pinned';
import Status from '@/domain/entity/tab/status';
import Title from '@/domain/entity/tab/title';
import Url from '@/domain/entity/url/url';
import ValueObject from '@/domain/entity/valueObject';
import WindowId from '@/domain/entity/window/id';

interface TabProps {
  readonly id: Id;
  readonly pinned: Pinned;
  readonly url: Url;
  readonly active: Active;
  readonly index: Index;
  readonly status: Status;
  readonly title: Title;
  readonly windowId: WindowId;
}

export default class Tab extends ValueObject<TabProps> {
  static of(props: TabProps): Tab {
    return new Tab(props);
  }

  get id(): Id {
    return this.value.id;
  }

  get pinned(): Pinned {
    return this.value.pinned;
  }

  get url(): Url {
    return this.value.url;
  }

  get active(): Active {
    return this.value.active;
  }

  get index(): Index {
    return this.value.index;
  }

  get status(): Status {
    return this.value.status;
  }

  get title(): Title {
    return this.value.title;
  }

  get windowId(): WindowId {
    return this.value.windowId;
  }

  override toJSON(): any {
    return {
      id: this.id.value,
      url: this.url,
      pinned: this.pinned,
    };
  }
}
