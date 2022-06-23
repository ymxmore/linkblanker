import InputPort from '@/usecase/core/inputPort';
import TabBundleCleanInputData from '@/usecase/tabBundle/clean/tabBundleCleanInputData';
import TabBundleDeleteInputData from '@/usecase/tabBundle/delete/tabBundleDeleteInputData';
import TabBundleListInputData from '@/usecase/tabBundle/list/tabBundleListInputData';
import TabBundleUndoInputData from '@/usecase/tabBundle/undo/tabBundleUndoInputData';

export default class TabBundleController {
  constructor(
    private readonly tabBundleListInputPort: InputPort<TabBundleListInputData>,
    private readonly tabBundleDeleteInputPort: InputPort<TabBundleDeleteInputData>,
    private readonly tabBundleUndoInputPort: InputPort<TabBundleUndoInputData>,
    private readonly tabBundleCleanInputPort: InputPort<TabBundleCleanInputData>,
  ) {}

  list(from: number, min: number) {
    this.tabBundleListInputPort.execute({ from, min });
  }

  delete(id: number) {
    this.tabBundleDeleteInputPort.execute({ id });
  }

  undo(from: number, id: number) {
    this.tabBundleUndoInputPort.execute({ from, id });
  }

  clean(max: number) {
    this.tabBundleCleanInputPort.execute({ max });
  }
}
