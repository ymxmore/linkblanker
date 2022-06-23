import Id from '@/domain/entity/tab/id';
import PreferenceRepository from '@/domain/repository/preferenceRepository';
import TabService from '@/domain/service/tabService';
import InputPort from '@/usecase/core/inputPort';
import OutputPort from '@/usecase/core/outputPort';
import TabGetInputData from '@/usecase/tab/get/tabGetInputData';
import TabGetOutputData from '@/usecase/tab/get/tabGetOutputData';

export default class TabGetInteractor implements InputPort<TabGetInputData> {
  constructor(
    private readonly outputPort: OutputPort<TabGetOutputData> | null,
    private readonly preferenceRepository: PreferenceRepository,
    private readonly tabService: TabService,
  ) {}

  async execute(data: TabGetInputData) {
    const [tab, pref] = await Promise.all([
      this.tabService.get(data.id ? Id.of(data.id) : null),
      this.preferenceRepository.get(),
    ]);

    this.outputPort?.execute({
      tab: {
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
      },
      preference: {
        clickPosition: pref.clickPosition.value,
        disabledDirectory: pref.disabledDirectory.map((item) => item.value),
        disabledDomain: pref.disabledDomain.map((item) => item.value),
        disabledOn: pref.disabledOn.value,
        disabledPage: pref.disabledPage.map((item) => item.value),
        disabledSameDomain: pref.disabledSameDomain.value,
        enabledBackgroundOpen: pref.enabledBackgroundOpen.value,
        enabledExtension: pref.enabledExtension.value,
        enabledMulticlickClose: pref.enabledMulticlickClose.value,
        noCloseFixedTab: pref.noCloseFixedTab.value,
        shortcutKeyToggleEnabled: pref.shortcutKeyToggleEnabled.map(
          (item) => item.value,
        ),
        version: pref.version.value,
        visibleLinkState: pref.visibleLinkState.value,
      },
    });
  }
}
