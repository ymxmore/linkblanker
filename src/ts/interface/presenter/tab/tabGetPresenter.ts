import TabGetView from '@/interface/view/tab/tabGetView';
import OutputPort from '@/usecase/core/outputPort';
import TabGetOutputData from '@/usecase/tab/get/tabGetOutputData';

export default class TabGetPresenter implements OutputPort<TabGetOutputData> {
  constructor(private views: TabGetView[]) {}

  execute(data: TabGetOutputData) {
    this.views.forEach((item) => {
      item(data);
    });
  }
}
