import TabCloseView from '@/interface/view/tab/tabCloseView';
import OutputPort from '@/usecase/core/outputPort';
import TabCloseOutputData from '@/usecase/tab/close/tabCloseOutputData';

export default class TabClosePresenter
  implements OutputPort<TabCloseOutputData>
{
  constructor(private views: TabCloseView[]) {}

  execute(data: TabCloseOutputData) {
    this.views.forEach((item) => {
      item(data);
    });
  }
}
