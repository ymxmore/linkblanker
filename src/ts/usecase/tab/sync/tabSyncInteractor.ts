import Id from '@/domain/entity/tab/id';
import PreferenceRepository from '@/domain/repository/preferenceRepository';
import PreferenceService from '@/domain/service/preferenceService';
import TabService from '@/domain/service/tabService';
import InputPort from '@/usecase/core/inputPort';
import OutputPort from '@/usecase/core/outputPort';
import TabSyncInputData from '@/usecase/tab/sync/tabSyncInputData';
import TabSyncOutputData from '@/usecase/tab/sync/tabSyncOutputData';

export default class TabSyncInteractor implements InputPort<TabSyncInputData> {
  constructor(
    private readonly outputPort: OutputPort<TabSyncOutputData> | null,
    private readonly preferenceRepository: PreferenceRepository,
    private readonly preferenceService: PreferenceService,
    private readonly tabService: TabService,
  ) {}

  async execute(data: TabSyncInputData) {
    const [tabs, pref] = await Promise.all([
      data.id
        ? [await this.tabService.get(Id.of(data.id))]
        : this.tabService.getAll(),
      this.preferenceRepository.get(),
    ]);

    await Promise.all(
      tabs.map((tab) => {
        const enabled = this.preferenceService.enabledOpenFromUrl(
          tab.url,
          pref.enabledExtension,
          pref.disabledDomain,
          pref.disabledDirectory,
          pref.disabledPage,
          pref.disabledOn,
        );

        return this.tabService.action(tab.id, enabled, pref.version);
      }),
    );

    this.outputPort?.execute({});
  }
}
