import TabBundleUndoView from '@/interface/view/tabBundle/tabBundleUndoView';
import OutputPort from '@/usecase/core/outputPort';
import TabBundleUndoOutputData from '@/usecase/tabBundle/undo/tabBundleUndoOutputData';

export default class TabBundleUndoPresenter
  implements OutputPort<TabBundleUndoOutputData>
{
  constructor(private views: TabBundleUndoView[]) {}

  execute(data: TabBundleUndoOutputData) {
    this.views.forEach((item) => {
      item(data);
    });
  }
}
