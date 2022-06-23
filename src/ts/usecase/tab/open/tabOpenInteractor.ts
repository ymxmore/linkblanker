import Index from '@/domain/entity/tab';
import Active from '@/domain/entity/tab/active';
import Id from '@/domain/entity/tab/id';
import Pinned from '@/domain/entity/tab/pinned';
import Tab from '@/domain/entity/tab/tab';
import Url from '@/domain/entity/url/url';
import PreferenceRepository from '@/domain/repository/preferenceRepository';
import TabService from '@/domain/service/tabService';
import InputPort from '@/usecase/core/inputPort';
import OutputPort from '@/usecase/core/outputPort';
import TabOpenInputData from '@/usecase/tab/open/tabOpenInputData';
import TabOpenOutputData from '@/usecase/tab/open/tabOpenOutputData';

export default class TabOpenInteractor implements InputPort<TabOpenInputData> {
  constructor(
    private readonly outputPort: OutputPort<TabOpenOutputData> | null,
    private readonly preferenceRepository: PreferenceRepository,
    private readonly tabService: TabService,
  ) {}

  async execute(data: TabOpenInputData) {
    const [pref, from] = await Promise.all([
      this.preferenceRepository.get(),
      this.tabService.get(Id.of(data.from)),
    ]);

    const tabs: Tab[] = [];

    for (let i = 0; i < data.urls.length; i++) {
      tabs.push(
        await this.tabService.open(
          Url.href(data.urls[i]),
          Index.of(from.index.value + 1),
          Active.of(!pref.enabledBackgroundOpen.value),
          Pinned.of(false),
        ),
      );
    }

    this.outputPort?.execute({});
  }
}
