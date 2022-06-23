import Preference from '@/domain/entity/preference/preference';

export default interface PreferenceRepository {
  get(): Promise<Preference>;
  set(data: Preference): Promise<void>;
}
