import ClickPosition, {
  CLICK_POSITION,
} from '@/domain/entity/preference/clickPosition';
import DisabledDirectory from '@/domain/entity/preference/disabledDirectory';
import DisabledDomain from '@/domain/entity/preference/disabledDomain';
import DisabledOn from '@/domain/entity/preference/disabledOn';
import DisabledPage from '@/domain/entity/preference/disabledPage';
import DisabledSameDomain from '@/domain/entity/preference/disabledSameDomain';
import EnabledBackgroundOpen from '@/domain/entity/preference/enabledBackgroundOpen';
import EnabledExtension from '@/domain/entity/preference/enabledExtension';
import EnabledMulticlickClose from '@/domain/entity/preference/enabledMulticlickClose';
import NoCloseFixedTab from '@/domain/entity/preference/noCloseFixedTab';
import ShortcutKeyToggleEnabled from '@/domain/entity/preference/shortcutKeyToggleEnabled';
import Version from '@/domain/entity/preference/version';
import VisibleLinkState from '@/domain/entity/preference/visibleLinkState';
import ValueObject from '@/domain/entity/valueObject';

// TODO: 各フィールド名を端的にわかりやすくする

export interface PreferenceProps {
  readonly clickPosition: ClickPosition;
  readonly disabledDirectory: DisabledDirectory[];
  readonly disabledDomain: DisabledDomain[];
  readonly disabledOn: DisabledOn;
  readonly disabledPage: DisabledPage[];
  readonly disabledSameDomain: DisabledSameDomain;
  readonly enabledBackgroundOpen: EnabledBackgroundOpen;
  readonly enabledExtension: EnabledExtension;
  readonly enabledMulticlickClose: EnabledMulticlickClose;
  readonly noCloseFixedTab: NoCloseFixedTab;
  readonly shortcutKeyToggleEnabled: ShortcutKeyToggleEnabled[];
  readonly version: Version;
  readonly visibleLinkState: VisibleLinkState;
}

export default class Preference extends ValueObject<PreferenceProps> {
  static of(props: PreferenceProps): Preference {
    return new Preference(props);
  }

  get clickPosition(): ClickPosition {
    return this.value.clickPosition;
  }

  get disabledDirectory(): DisabledDirectory[] {
    return this.value.disabledDirectory;
  }

  get disabledDomain(): DisabledDomain[] {
    return this.value.disabledDomain;
  }

  get disabledOn(): DisabledOn {
    return this.value.disabledOn;
  }

  get disabledPage(): DisabledPage[] {
    return this.value.disabledPage;
  }

  get disabledSameDomain(): DisabledSameDomain {
    return this.value.disabledSameDomain;
  }

  get enabledBackgroundOpen(): EnabledBackgroundOpen {
    return this.value.enabledBackgroundOpen;
  }

  get enabledExtension(): EnabledExtension {
    return this.value.enabledExtension;
  }

  get enabledMulticlickClose(): EnabledMulticlickClose {
    return this.value.enabledMulticlickClose;
  }

  get noCloseFixedTab(): NoCloseFixedTab {
    return this.value.noCloseFixedTab;
  }

  get shortcutKeyToggleEnabled(): ShortcutKeyToggleEnabled[] {
    return this.value.shortcutKeyToggleEnabled;
  }

  get version(): Version {
    return this.value.version;
  }

  get visibleLinkState(): VisibleLinkState {
    return this.value.visibleLinkState;
  }
}

export const InitialPreference = Preference.of({
  clickPosition: ClickPosition.of(CLICK_POSITION.LEFT),
  disabledDirectory: [],
  disabledDomain: [],
  disabledOn: DisabledOn.of(false),
  disabledPage: [],
  disabledSameDomain: DisabledSameDomain.of(false),
  enabledBackgroundOpen: EnabledBackgroundOpen.of(false),
  enabledExtension: EnabledExtension.of(true),
  enabledMulticlickClose: EnabledMulticlickClose.of(false),
  noCloseFixedTab: NoCloseFixedTab.of(true),
  shortcutKeyToggleEnabled: [],
  version: Version.of('0.0.0'),
  visibleLinkState: VisibleLinkState.of(false),
});

export const PreferencePropKeys = Object.keys(InitialPreference.value);
