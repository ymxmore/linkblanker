import InputPort from '@/usecase/core/inputPort';
import TabCloseInputData from '@/usecase/tab/close/tabCloseInputData';
import TabGetInputData from '@/usecase/tab/get/tabGetInputData';
import TabListInputData from '@/usecase/tab/list/tabListInputData';
import TabOpenInputData from '@/usecase/tab/open/tabOpenInputData';
import TabSyncInputData from '@/usecase/tab/sync/tabSyncInputData';

export default class TabController {
  constructor(
    private readonly tabCloseInputPort: InputPort<TabCloseInputData>,
    private readonly tabGetInputPort: InputPort<TabGetInputData>,
    private readonly tabOpenInputPort: InputPort<TabOpenInputData>,
    private readonly tabSyncInputPort: InputPort<TabSyncInputData>,
    private readonly tabListInputPort: InputPort<TabListInputData>,
  ) {}

  close(from: number, direction: number) {
    this.tabCloseInputPort.execute({ from, direction });
  }

  get(id?: number) {
    this.tabGetInputPort.execute({ id });
  }

  open(from: number, url: string) {
    this.tabOpenInputPort.execute({ from, urls: [url] });
  }

  sync(id?: number) {
    this.tabSyncInputPort.execute({ id });
  }

  list() {
    this.tabListInputPort.execute({});
  }
}
