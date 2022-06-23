import TabListView from '@/interface/view/tab/tabListView';
import OutputPort from '@/usecase/core/outputPort';
import TabListOutputData from '@/usecase/tab/list/tabListOutputData';

export default class TabListPresenter implements OutputPort<TabListOutputData> {
  constructor(private views: TabListView[]) {}

  execute(data: TabListOutputData) {
    this.views.forEach((item) => {
      item(data);
    });
  }
}
