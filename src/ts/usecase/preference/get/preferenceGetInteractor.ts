import PreferenceRepository from '@/domain/repository/preferenceRepository';
import InputPort from '@/usecase/core/inputPort';
import OutputPort from '@/usecase/core/outputPort';
import PreferenceGetInputData from '@/usecase/preference/get/preferenceGetInputData';
import PreferenceGetOutputData from '@/usecase/preference/get/preferenceGetOutputData';

export default class PreferenceGetInteractor
  implements InputPort<PreferenceGetInputData>
{
  constructor(
    private readonly outputPort: OutputPort<PreferenceGetOutputData> | null,
    private readonly preferenceRepository: PreferenceRepository,
  ) {}

  async execute() {
    const pref = await this.preferenceRepository.get();

    this.outputPort?.execute({
      clickPosition: pref.clickPosition.value,
      disabledDirectory: pref.disabledDirectory.map((item) => item.value),
      disabledDomain: pref.disabledDomain.map((item) => item.value),
      disabledOn: pref.disabledOn.value,
      disabledPage: pref.disabledPage.map((item) => item.value),
      disabledSameDomain: pref.disabledSameDomain.value,
      enabledBackgroundOpen: pref.enabledBackgroundOpen.value,
      enabledExtension: pref.enabledExtension.value,
      enabledMulticlickClose: pref.enabledMulticlickClose.value,
      noCloseFixedTab: pref.noCloseFixedTab.value,
      shortcutKeyToggleEnabled: pref.shortcutKeyToggleEnabled.map(
        (item) => item.value,
      ),
      version: pref.version.value,
      visibleLinkState: pref.visibleLinkState.value,
    });
  }
}
