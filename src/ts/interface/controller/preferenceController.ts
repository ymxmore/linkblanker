import InputPort from '@/usecase/core/inputPort';
import PreferenceGetInputData from '@/usecase/preference/get/preferenceGetInputData';
import PreferenceInitInputData from '@/usecase/preference/init/preferenceInitInputData';
import PreferenceSetInputData, {
  Key,
  Value,
} from '@/usecase/preference/set/preferenceSetInputData';

export default class PreferenceController {
  constructor(
    private readonly preferenceInitInputPort: InputPort<PreferenceInitInputData>,
    private readonly preferenceGetInputPort: InputPort<PreferenceGetInputData>,
    private readonly preferenceSetInputPort: InputPort<PreferenceSetInputData>,
  ) {}

  init(version: string) {
    this.preferenceInitInputPort.execute({ version });
  }

  get() {
    this.preferenceGetInputPort.execute({});
  }

  set(preference: Record<Key, Value>) {
    this.preferenceSetInputPort.execute({ preference });
  }
}
