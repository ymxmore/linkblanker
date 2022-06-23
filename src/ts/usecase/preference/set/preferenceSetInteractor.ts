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
import Preference from '@/domain/entity/preference/preference';
import ShortcutKeyToggleEnabled from '@/domain/entity/preference/shortcutKeyToggleEnabled';
import Version from '@/domain/entity/preference/version';
import VisibleLinkState from '@/domain/entity/preference/visibleLinkState';
import Url from '@/domain/entity/url/url';
import PreferenceRepository from '@/domain/repository/preferenceRepository';
import TabService from '@/domain/service/tabService';
import InputPort from '@/usecase/core/inputPort';
import OutputPort from '@/usecase/core/outputPort';
import PreferenceSetInputData, {
  Key,
  Value,
} from '@/usecase/preference/set/preferenceSetInputData';
import PreferenceSetOutputData from '@/usecase/preference/set/preferenceSetOutputData';

type PreferenceField =
  | ClickPosition
  | DisabledDirectory
  | DisabledDomain
  | DisabledOn
  | DisabledPage
  | DisabledSameDomain
  | EnabledBackgroundOpen
  | EnabledExtension
  | EnabledMulticlickClose
  | NoCloseFixedTab
  | ShortcutKeyToggleEnabled
  | Version
  | VisibleLinkState;

export default class PreferenceSetInteractor
  implements InputPort<PreferenceSetInputData>
{
  constructor(
    private readonly outputPort: OutputPort<PreferenceSetOutputData> | null,
    private readonly preferenceRepository: PreferenceRepository,
    private readonly tabService: TabService,
  ) {}

  async execute(data: PreferenceSetInputData) {
    const [tab, pref] = await Promise.all([
      this.tabService.get(),
      this.preferenceRepository.get(),
    ]);

    const value = (Object.keys(data.preference) as Array<Key>).reduce(
      (p, key) => {
        return {
          ...p,
          ...this.normalize(pref, tab.url, key, data.preference[key]),
        };
      },
      {},
    );

    await this.preferenceRepository.set(
      Preference.of({ ...pref.value, ...value }),
    );

    this.outputPort?.execute({});
  }

  private normalize(
    pref: Preference,
    url: Url,
    key: Key,
    value: Value,
  ): Record<string, PreferenceField | PreferenceField[]> {
    let k: string = key.toString();
    let v: PreferenceField | PreferenceField[] | null = null;

    switch (k) {
      case 'clickPositionLeft':
        if (typeof value === 'boolean') {
          if (value) {
            v = ClickPosition.of(
              pref.clickPosition.value | CLICK_POSITION.LEFT,
            );
          } else {
            v = ClickPosition.of(
              pref.clickPosition.value & ~CLICK_POSITION.LEFT,
            );
          }

          k = 'clickPosition';
        }
        break;
      case 'clickPositionMiddle':
        if (typeof value === 'boolean') {
          if (value) {
            v = ClickPosition.of(
              pref.clickPosition.value | CLICK_POSITION.MIDDLE,
            );
          } else {
            v = ClickPosition.of(
              pref.clickPosition.value & ~CLICK_POSITION.MIDDLE,
            );
          }

          k = 'clickPosition';
        }
        break;
      case 'clickPositionRight':
        if (typeof value === 'boolean') {
          if (value) {
            v = ClickPosition.of(
              pref.clickPosition.value | CLICK_POSITION.RIGHT,
            );
          } else {
            v = ClickPosition.of(
              pref.clickPosition.value & ~CLICK_POSITION.RIGHT,
            );
          }

          k = 'clickPosition';
        }
        break;
      case 'disabledDirectory':
        if (typeof value == 'boolean') {
          v = this.normalizeArray(
            pref.disabledDirectory.map((v) => v.value),
            url.directory.value,
            value,
          ).map((v) => DisabledDirectory.of(v));
        }
        break;
      case 'disabledDomain':
        if (typeof value == 'boolean') {
          v = this.normalizeArray(
            pref.disabledDomain.map((v) => v.value),
            url.host.value,
            value,
          ).map((v) => DisabledDomain.of(v));
        }
        break;
      case 'disabledOn':
        if (typeof value == 'boolean') {
          v = DisabledOn.of(value);
        }
        break;
      case 'disabledPage':
        if (typeof value == 'boolean') {
          v = this.normalizeArray(
            pref.disabledPage.map((v) => v.value),
            url.href.value,
            value,
          ).map((v) => DisabledPage.of(v));
        }
        break;
      case 'disabledSameDomain':
        if (typeof value == 'boolean') {
          v = DisabledSameDomain.of(value);
        }
        break;
      case 'enabledBackgroundOpen':
        if (typeof value == 'boolean') {
          v = EnabledBackgroundOpen.of(value);
        }
        break;
      case 'enabledExtension':
        if (typeof value == 'boolean') {
          v = EnabledExtension.of(value);
        }
        break;
      case 'enabledMulticlickClose':
        if (typeof value == 'boolean') {
          v = EnabledMulticlickClose.of(value);
        }
        break;
      case 'noCloseFixedTab':
        if (typeof value == 'boolean') {
          v = NoCloseFixedTab.of(value);
        }
        break;
      case 'shortcutKeyToggleEnabled':
        // TODO
        break;
      case 'version':
        if (typeof value == 'string') {
          v = Version.of(value);
        }
        break;
      case 'visibleLinkState':
        if (typeof value == 'boolean') {
          v = VisibleLinkState.of(value);
        }
        break;
    }

    if (v) {
      return {
        [k]: v,
      };
    }

    throw new Error(`サポートしていないアイテムです。 [${key}: ${value}]`);
  }

  private normalizeArray(arr: string[], item: string, enabled: boolean) {
    if (item && item !== '' && item !== null) {
      const index = arr.indexOf(item);

      if (enabled) {
        if (index === -1) {
          arr.push(item);
        }
      } else {
        if (index > -1) {
          arr.splice(index, 1);
        }
      }
    }

    return arr.filter((v) => v);
  }
}
