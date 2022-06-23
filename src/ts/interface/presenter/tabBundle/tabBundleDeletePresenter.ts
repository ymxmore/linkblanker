import TabBundleDeleteView from '@/interface/view/tabBundle/tabBundleDeleteView';
import OutputPort from '@/usecase/core/outputPort';
import TabBundleDeleteOutputData from '@/usecase/tabBundle/delete/tabBundleDeleteOutputData';

export default class TabBundleDeletePresenter
  implements OutputPort<TabBundleDeleteOutputData>
{
  constructor(private views: TabBundleDeleteView[]) {}

  execute(data: TabBundleDeleteOutputData) {
    this.views.forEach((item) => {
      item(data);
    });
  }
}
