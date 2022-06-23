import Index from '@/domain/entity/tab';
import Active from '@/domain/entity/tab/active';
import { DIRECTION } from '@/domain/entity/tabBundle/direction';
import Id from '@/domain/entity/tabBundle/id';
import TabBundleRepository from '@/domain/repository/tabBundleRepository';
import TabService from '@/domain/service/tabService';
import InputPort from '@/usecase/core/inputPort';
import OutputPort from '@/usecase/core/outputPort';
import TabBundleUndoInputData from '@/usecase/tabBundle/undo/tabBundleUndoInputData';
import TabBundleUndoOutputData from '@/usecase/tabBundle/undo/tabBundleUndoOutputData';

export default class TabBundleUndoInteractor
  implements InputPort<TabBundleUndoInputData>
{
  constructor(
    private readonly outputPort: OutputPort<TabBundleUndoOutputData> | null,
    private readonly tabBundleRepository: TabBundleRepository,
    private readonly tabService: TabService,
  ) {}

  async execute(data: TabBundleUndoInputData) {
    const [tabBundle, tab] = await Promise.all([
      this.tabBundleRepository.get(Id.of(data.id)),
      this.tabService.get(Id.of(data.from)),
    ]);

    for (let i = 0; i < tabBundle.tabs.length; i++) {
      await this.tabService.open(
        tabBundle.tabs[i].url,
        Index.of(
          tabBundle.direction.value === DIRECTION.RIGHT
            ? tab.index.value + 1 + i
            : tab.index.value,
        ),
        Active.of(false),
        tabBundle.tabs[i].pinned,
      );
    }

    await this.tabBundleRepository.delete(Id.of(data.id));
    this.outputPort?.execute({});
  }
}
