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
import Preference, {
  InitialPreference,
  PreferenceProps,
} from '@/domain/entity/preference/preference';
import ShortcutKeyToggleEnabled from '@/domain/entity/preference/shortcutKeyToggleEnabled';
import VisibleLinkState from '@/domain/entity/preference/visibleLinkState';
import PreferenceRepository from '@/domain/repository/preferenceRepository';
import { isArray } from '@/helper';

export default class LocalStoragePreferenceRepository
  implements PreferenceRepository
{
  constructor(private storage: Storage) {}

  get(): Promise<Preference> {
    const data = this.storage;

    const props = Object.keys(InitialPreference.value).reduce((obj, key) => {
      switch (key) {
        case 'clickPosition': {
          let cp = InitialPreference.clickPosition.value;

          if ('enabled-left-click' in data) {
            if (Number(data['enabled-left-click'])) {
              cp |= CLICK_POSITION.LEFT;
            } else {
              cp &= ~CLICK_POSITION.LEFT;
            }
          }

          if ('enabled-middle-click' in data) {
            if (Number(data['enabled-middle-click'])) {
              cp |= CLICK_POSITION.MIDDLE;
            } else {
              cp &= ~CLICK_POSITION.MIDDLE;
            }
          }

          if ('enabled-right-click' in data) {
            if (Number(data['enabled-right-click'])) {
              cp |= CLICK_POSITION.RIGHT;
            } else {
              cp &= ~CLICK_POSITION.RIGHT;
            }
          }

          obj[key] = ClickPosition.of(cp);

          break;
        }
        case 'disabledDirectory': {
          let disabledDirectory: DisabledDirectory[] =
            InitialPreference.disabledDirectory;

          if ('disabled-directory' in data) {
            const disabledDirectoryParsed = JSON.parse(
              data['disabled-directory'] || '[]',
            ) as string[];

            if (isArray(disabledDirectoryParsed)) {
              disabledDirectory = disabledDirectoryParsed.map((item) =>
                DisabledDirectory.of(item),
              );
            }
          }

          obj[key] = disabledDirectory;

          break;
        }
        case 'disabledDomain': {
          let disabledDomain: DisabledDomain[] =
            InitialPreference.disabledDomain;

          if ('disabled-domain' in data) {
            const disabledDomainParsed = JSON.parse(
              data['disabled-domain'] || '[]',
            ) as string[];

            if (isArray(disabledDomainParsed)) {
              disabledDomain = disabledDomainParsed.map((item) =>
                DisabledDomain.of(item),
              );
            }
          }

          obj[key] = disabledDomain;

          break;
        }
        case 'disabledOn': {
          let disabledOn: DisabledOn = InitialPreference.disabledOn;

          if ('disabled-on' in data) {
            disabledOn = DisabledOn.of(!!Number(data['disabled-on']));
          }

          obj[key] = disabledOn;

          break;
        }
        case 'disabledPage': {
          let disabledPage: DisabledPage[] = InitialPreference.disabledPage;

          if ('disabled-page' in data) {
            const disabledPageParsed = JSON.parse(
              data['disabled-page'] || '[]',
            ) as string[];

            if (isArray(disabledPageParsed)) {
              disabledPage = disabledPageParsed.map((item) =>
                DisabledPage.of(item),
              );
            }
          }

          obj[key] = disabledPage;

          break;
        }
        case 'disabledSameDomain': {
          let disabledSameDomain: DisabledSameDomain =
            InitialPreference.disabledSameDomain;

          if ('disabled-same-domain' in data) {
            disabledSameDomain = DisabledSameDomain.of(
              !!Number(data['disabled-same-domain']),
            );
          }

          obj[key] = disabledSameDomain;

          break;
        }
        case 'enabledBackgroundOpen': {
          let enabledBackgroundOpen: EnabledBackgroundOpen =
            InitialPreference.enabledBackgroundOpen;

          if ('enabled-background-open' in data) {
            enabledBackgroundOpen = EnabledBackgroundOpen.of(
              !!Number(data['enabled-background-open']),
            );
          }

          obj[key] = enabledBackgroundOpen;

          break;
        }
        case 'enabledExtension': {
          let enabledExtension: EnabledExtension =
            InitialPreference.enabledExtension;

          if ('enabled-extension' in data) {
            enabledExtension = EnabledExtension.of(
              !!Number(data['enabled-extension']),
            );
          }

          obj[key] = enabledExtension;

          break;
        }
        case 'enabledMulticlickClose': {
          let enabledMulticlickClose: EnabledMulticlickClose =
            InitialPreference.enabledMulticlickClose;

          if ('enabled-multiclick-close' in data) {
            enabledMulticlickClose = EnabledMulticlickClose.of(
              !!Number(data['enabled-multiclick-close']),
            );
          }

          obj[key] = enabledMulticlickClose;

          break;
        }
        case 'noCloseFixedTab': {
          let noCloseFixedTab: NoCloseFixedTab =
            InitialPreference.noCloseFixedTab;

          if ('no-close-fixed-tab' in data) {
            noCloseFixedTab = NoCloseFixedTab.of(
              !!Number(data['no-close-fixed-tab']),
            );
          }

          obj[key] = noCloseFixedTab;

          break;
        }
        case 'shortcutKeyToggleEnabled': {
          let shortcutKeyToggleEnabled: ShortcutKeyToggleEnabled[] =
            InitialPreference.shortcutKeyToggleEnabled;

          if ('shortcut-key-toggle-enabled' in data) {
            const shortcutKeyToggleEnabledSplited: string[] = (
              (data['shortcut-key-toggle-enabled'] || '') as string
            ).split(',');

            shortcutKeyToggleEnabled = shortcutKeyToggleEnabledSplited
              .map((item) => item.trim())
              .filter((item) => !!item)
              .map((item) => ShortcutKeyToggleEnabled.of(Number(item.trim())));
          }

          obj[key] = shortcutKeyToggleEnabled;
          break;
        }
        case 'version': {
          obj[key] = InitialPreference.version;
          break;
        }
        case 'visibleLinkState': {
          let visibleLinkState: VisibleLinkState =
            InitialPreference.visibleLinkState;

          if ('visible-link-state' in data) {
            visibleLinkState = VisibleLinkState.of(
              !!Number(data['visible-link-state']),
            );
          }

          obj[key] = visibleLinkState;

          break;
        }
        default: {
          break;
        }
      }

      return obj;
    }, {});

    return Promise.resolve(Preference.of(props as PreferenceProps));
  }

  set(): Promise<void> {
    throw new Error('ローカルストレージへの保存はサポートしていません。');
  }
}
