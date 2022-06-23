import TabBundleListView from '@/interface/view/tabBundle/tabBundleListView';
import OutputPort from '@/usecase/core/outputPort';
import TabBundleListOutputData from '@/usecase/tabBundle/list/tabBundleListOutputData';

export default class TabBundleListPresenter
  implements OutputPort<TabBundleListOutputData>
{
  constructor(private views: TabBundleListView[]) {}

  execute(data: TabBundleListOutputData) {
    this.views.forEach((item) => {
      item(data);
    });
  }
}
