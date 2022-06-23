import TabSyncView from '@/interface/view/tab/tabSyncView';
import OutputPort from '@/usecase/core/outputPort';
import TabSyncOutputData from '@/usecase/tab/sync/tabSyncOutputData';

export default class TabSyncPresenter implements OutputPort<TabSyncOutputData> {
  constructor(private readonly views: TabSyncView[]) {}

  execute(data: TabSyncOutputData) {
    this.views.forEach((item) => {
      item(data);
    });
  }
}
