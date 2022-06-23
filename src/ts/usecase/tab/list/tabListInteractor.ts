import Tab from '@/domain/entity/tab/tab';
import TabService from '@/domain/service/tabService';
import InputPort from '@/usecase/core/inputPort';
import OutputPort from '@/usecase/core/outputPort';
import TabListInputData from '@/usecase/tab/list/tabListInputData';
import TabListOutputData from '@/usecase/tab/list/tabListOutputData';

export default class TabListInteractor implements InputPort<TabListInputData> {
  constructor(
    private readonly outputPort: OutputPort<TabListOutputData> | null,
    private readonly tabService: TabService,
  ) {}

  async execute() {
    const tabs: Tab[] = await this.tabService.getAll();

    this.outputPort?.execute({
      tabs: tabs.map((tab) => ({
        id: tab.id.value,
        pinned: tab.pinned.value,
        url: {
          hash: tab.url.hash.value,
          host: tab.url.host.value,
          hostname: tab.url.hostname.value,
          href: tab.url.href.value,
          origin: tab.url.origin.value,
          password: tab.url.password.value,
          pathname: tab.url.pathname.value,
          port: tab.url.port.value,
          protocol: tab.url.protocol.value,
          search: tab.url.search.value,
          username: tab.url.username.value,
          directory: tab.url.directory.value,
        },
        active: tab.active.value,
        index: tab.index.value,
        status: tab.status.value,
        title: tab.title.value,
        windowId: tab.windowId.value,
      })),
    });
  }
}
