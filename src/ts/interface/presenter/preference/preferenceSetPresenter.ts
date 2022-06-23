import PreferenceSetView from '@/interface/view/preference/preferenceSetView';
import OutputPort from '@/usecase/core/outputPort';
import PreferenceSetOutputData from '@/usecase/preference/set/preferenceSetOutputData';

export default class PreferenceSetPresenter
  implements OutputPort<PreferenceSetOutputData>
{
  constructor(private views: PreferenceSetView[]) {}

  execute() {
    this.views.forEach((item) => {
      item();
    });
  }
}
