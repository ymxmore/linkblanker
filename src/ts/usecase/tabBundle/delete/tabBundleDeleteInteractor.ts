import Id from '@/domain/entity/tabBundle/id';
import TabBundleRepository from '@/domain/repository/tabBundleRepository';
import InputPort from '@/usecase/core/inputPort';
import OutputPort from '@/usecase/core/outputPort';
import TabBundleDeleteInputData from '@/usecase/tabBundle/delete/tabBundleDeleteInputData';
import TabBundleDeleteOutputData from '@/usecase/tabBundle/delete/tabBundleDeleteOutputData';

export default class TabBundleDeleteInteractor
  implements InputPort<TabBundleDeleteInputData>
{
  constructor(
    private readonly outputPort: OutputPort<TabBundleDeleteOutputData> | null,
    private readonly tabBundleRepository: TabBundleRepository,
  ) {}

  async execute(data: TabBundleDeleteInputData) {
    await this.tabBundleRepository.delete(Id.of(data.id));
    this.outputPort?.execute({});
  }
}
