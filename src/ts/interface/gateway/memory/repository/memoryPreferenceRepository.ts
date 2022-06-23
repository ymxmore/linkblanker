import Preference, {
  InitialPreference,
} from '@/domain/entity/preference/preference';
import PreferenceRepository from '@/domain/repository/preferenceRepository';

export default class MemoryPreferenceRepository
  implements PreferenceRepository
{
  private data: Preference = InitialPreference;

  get(): Promise<Preference> {
    return Promise.resolve(this.data);
  }

  set(data: Preference): Promise<void> {
    this.data = data;
    return Promise.resolve();
  }
}
