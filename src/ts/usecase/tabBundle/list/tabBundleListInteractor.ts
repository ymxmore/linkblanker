import Id from '@/domain/entity/tabBundle/id';
import TabBundle from '@/domain/entity/tabBundle/tabBundle';
import Time from '@/domain/entity/tabBundle/time';
import TabBundleRepository from '@/domain/repository/tabBundleRepository';
import InputPort from '@/usecase/core/inputPort';
import OutputPort from '@/usecase/core/outputPort';
import TabBundleListInputData from '@/usecase/tabBundle/list/tabBundleListInputData';
import TabBundleListOutputData from '@/usecase/tabBundle/list/tabBundleListOutputData';

export default class TabBundleListInteractor
  implements InputPort<TabBundleListInputData>
{
  constructor(
    private readonly outputPort: OutputPort<TabBundleListOutputData> | null,
    private readonly tabBundleRepository: TabBundleRepository,
  ) {}

  async execute(data: TabBundleListInputData) {
    const tabBundles: TabBundle[] = await this.tabBundleRepository.list(
      Id.of(data.from),
      Time.of(data.min),
    );

    this.outputPort?.execute({
      tabBundles: tabBundles.map((item) => ({
        id: item.id.value,
        direction: item.direction.value,
        from: item.from.value,
        time: item.time.value,
        tabs: item.tabs.map((tab) => ({
          pinned: tab.pinned.value,
          url: tab.url.href.value,
        })),
      })),
    });
  }
}
