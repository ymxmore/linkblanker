import Time from '@/domain/entity/tabBundle/time';
import TabBundleRepository from '@/domain/repository/tabBundleRepository';
import InputPort from '@/usecase/core/inputPort';
import OutputPort from '@/usecase/core/outputPort';
import TabBundleCleanInputData from '@/usecase/tabBundle/clean/tabBundleCleanInputData';
import TabBundleCleanOutputData from '@/usecase/tabBundle/clean/tabBundleCleanOutputData';

export default class TabBundleCleanInteractor
  implements InputPort<TabBundleCleanInputData>
{
  constructor(
    private readonly outputPort: OutputPort<TabBundleCleanOutputData> | null,
    private readonly tabBundleRepository: TabBundleRepository,
  ) {}

  async execute(data: TabBundleCleanInputData) {
    await this.tabBundleRepository.clean(Time.of(data.max));
    this.outputPort?.execute({});
  }
}
