import PreferenceGetView from '@/interface/view/preference/preferenceGetView';
import OutputPort from '@/usecase/core/outputPort';
import PreferenceGetOutputData from '@/usecase/preference/get/preferenceGetOutputData';

export default class PreferenceGetPresenter
  implements OutputPort<PreferenceGetOutputData>
{
  constructor(private views: PreferenceGetView[]) {}

  execute(data: PreferenceGetOutputData) {
    this.views.forEach((item) => {
      item(data);
    });
  }
}
