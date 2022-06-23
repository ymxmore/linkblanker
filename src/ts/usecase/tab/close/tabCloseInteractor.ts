import Id from '@/domain/entity/tab/id';
import Pinned from '@/domain/entity/tab/pinned';
import Direction from '@/domain/entity/tabBundle/direction';
import TabBundle from '@/domain/entity/tabBundle/tabBundle';
import Time from '@/domain/entity/tabBundle/time';
import PreferenceRepository from '@/domain/repository/preferenceRepository';
import TabBundleRepository from '@/domain/repository/tabBundleRepository';
import TabService from '@/domain/service/tabService';
import { getCurrentTime } from '@/helper';
import InputPort from '@/usecase/core/inputPort';
import OutputPort from '@/usecase/core/outputPort';
import TabCloseInputData from '@/usecase/tab/close/tabCloseInputData';
import TabCloseOutputData from '@/usecase/tab/close/tabCloseOutputData';

export default class TabCloseInteractor
  implements InputPort<TabCloseInputData>
{
  constructor(
    private readonly outputPort: OutputPort<TabCloseOutputData> | null,
    private readonly preferenceRepository: PreferenceRepository,
    private readonly tabBundleRepository: TabBundleRepository,
    private readonly tabService: TabService,
  ) {}

  async execute(data: TabCloseInputData) {
    const [pref, from] = await Promise.all([
      this.preferenceRepository.get(),
      this.tabService.get(Id.of(data.from)),
    ]);

    const direction = Direction.of(data.direction);

    const tabs = await this.tabService.findByDirection(
      from,
      direction,
      Pinned.of(pref.noCloseFixedTab.value),
    );

    if (tabs.length <= 0) {
      return;
    }

    await Promise.all(tabs.map((item) => this.tabService.close(item)));

    const id = await this.tabBundleRepository.generateId();
    const time = Time.of(getCurrentTime());

    await this.tabBundleRepository.set(
      TabBundle.of({
        id,
        time,
        from: from.id,
        direction,
        tabs: tabs.map((item) => ({
          pinned: item.pinned,
          url: item.url,
        })),
      }),
    );

    this.outputPort?.execute({
      id: id.value,
      from: from.id.value,
    });
  }
}
