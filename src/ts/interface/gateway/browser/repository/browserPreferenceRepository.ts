import { Storage } from 'webextension-polyfill';
import ClickPosition from '@/domain/entity/preference/clickPosition';
import DisabledDirectory from '@/domain/entity/preference/disabledDirectory';
import DisabledDomain from '@/domain/entity/preference/disabledDomain';
import DisabledOn from '@/domain/entity/preference/disabledOn';
import DisabledPage from '@/domain/entity/preference/disabledPage';
import DisabledSameDomain from '@/domain/entity/preference/disabledSameDomain';
import EnabledBackgroundOpen from '@/domain/entity/preference/enabledBackgroundOpen';
import EnabledExtension from '@/domain/entity/preference/enabledExtension';
import EnabledMulticlickClose from '@/domain/entity/preference/enabledMulticlickClose';
import NoCloseFixedTab from '@/domain/entity/preference/noCloseFixedTab';
import Preference, {
  InitialPreference,
} from '@/domain/entity/preference/preference';
import ShortcutKeyToggleEnabled from '@/domain/entity/preference/shortcutKeyToggleEnabled';
import Version from '@/domain/entity/preference/version';
import VisibleLinkState from '@/domain/entity/preference/visibleLinkState';
import PreferenceRepository from '@/domain/repository/preferenceRepository';

interface PreferencePrimitiveProps {
  readonly clickPosition: number;
  readonly disabledDirectory: string[];
  readonly disabledDomain: string[];
  readonly disabledOn: boolean;
  readonly disabledPage: string[];
  readonly disabledSameDomain: boolean;
  readonly enabledBackgroundOpen: boolean;
  readonly enabledExtension: boolean;
  readonly enabledMulticlickClose: boolean;
  readonly noCloseFixedTab: boolean;
  readonly shortcutKeyToggleEnabled: number[];
  readonly version: string;
  readonly visibleLinkState: boolean;
}

export default class BrowserPreferenceRepository
  implements PreferenceRepository
{
  constructor(private storage: Storage.StorageArea) {}

  async get(): Promise<Preference> {
    const data = await this.storage.get();

    const props = Object.keys(InitialPreference.value).reduce((obj, key) => {
      const value =
        key in data
          ? (data[key] as string)
          : JSON.stringify(InitialPreference.value[key]);
      obj[key] = JSON.parse(value) as
        | number
        | number[]
        | string
        | string[]
        | boolean;
      return obj;
    }, {} as PreferencePrimitiveProps);

    return Preference.of({
      clickPosition: ClickPosition.of(props.clickPosition),
      disabledDirectory: props.disabledDirectory.map((item) =>
        DisabledDirectory.of(item),
      ),
      disabledDomain: props.disabledDomain.map((item) =>
        DisabledDomain.of(item),
      ),
      disabledOn: DisabledOn.of(props.disabledOn),
      disabledPage: props.disabledPage.map((item) => DisabledPage.of(item)),
      disabledSameDomain: DisabledSameDomain.of(props.disabledSameDomain),
      enabledBackgroundOpen: EnabledBackgroundOpen.of(
        props.enabledBackgroundOpen,
      ),
      enabledExtension: EnabledExtension.of(props.enabledExtension),
      enabledMulticlickClose: EnabledMulticlickClose.of(
        props.enabledMulticlickClose,
      ),
      noCloseFixedTab: NoCloseFixedTab.of(props.noCloseFixedTab),
      shortcutKeyToggleEnabled: props.shortcutKeyToggleEnabled.map((item) =>
        ShortcutKeyToggleEnabled.of(item),
      ),
      version: Version.of(props.version),
      visibleLinkState: VisibleLinkState.of(props.visibleLinkState),
    });
  }

  async set(data: Preference): Promise<void> {
    return this.storage.set(
      Object.keys(data.value).reduce((obj, key) => {
        obj[key] = JSON.stringify(data[key]);
        return obj;
      }, {}),
    );
  }
}
