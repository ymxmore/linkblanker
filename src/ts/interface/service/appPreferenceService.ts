import ClickPosition from '@/domain/entity/preference/clickPosition';
import DisabledDirectory from '@/domain/entity/preference/disabledDirectory';
import DisabledDomain from '@/domain/entity/preference/disabledDomain';
import DisabledOn from '@/domain/entity/preference/disabledOn';
import DisabledPage from '@/domain/entity/preference/disabledPage';
import DisabledSameDomain from '@/domain/entity/preference/disabledSameDomain';
import EnabledExtension from '@/domain/entity/preference/enabledExtension';
import EnabledMulticlickClose from '@/domain/entity/preference/enabledMulticlickClose';
import Url from '@/domain/entity/url/url';
import PreferenceService from '@/domain/service/preferenceService';
import { DisabledState } from '@/domain/service/preferenceService';

export {
  DisabledState,
  DISABLED_STATE,
} from '@/domain/service/preferenceService';

export default class AppPreferenceService {
  constructor(private readonly preferenceService: PreferenceService) {}

  enabledUrl(url: string) {
    return this.preferenceService.enabledUrl(Url.href(url));
  }

  enabledOpenFromUrl(
    url: string,
    enabledExtension: boolean,
    disabledDomain: string[],
    disabledDirectory: string[],
    disabledPage: string[],
    disabledOn: boolean,
  ): boolean {
    return this.preferenceService.enabledOpenFromUrl(
      Url.href(url),
      EnabledExtension.of(enabledExtension),
      disabledDomain.map((item) => DisabledDomain.of(item)),
      disabledDirectory.map((item) => DisabledDirectory.of(item)),
      disabledPage.map((item) => DisabledPage.of(item)),
      DisabledOn.of(disabledOn),
    );
  }

  shouldOpenTab(
    from: string,
    to: string,
    enabledExtension: boolean,
    disabledDomain: string[],
    disabledDirectory: string[],
    disabledPage: string[],
    disabledOn: boolean,
    disabledSameDomain: boolean,
    clickPosition: number,
    hasOnClick: boolean,
    eventType: string,
    button: number,
  ): boolean {
    return this.preferenceService.shouldOpenTab(
      Url.href(from),
      Url.href(to),
      EnabledExtension.of(enabledExtension),
      disabledDomain.map((item) => DisabledDomain.of(item)),
      disabledDirectory.map((item) => DisabledDirectory.of(item)),
      disabledPage.map((item) => DisabledPage.of(item)),
      DisabledOn.of(disabledOn),
      DisabledSameDomain.of(disabledSameDomain),
      ClickPosition.of(clickPosition),
      hasOnClick,
      eventType,
      button,
    );
  }

  shouldMulticlickClose(
    enabledExtension: boolean,
    enabledMulticlickClose: boolean,
    clickCount: number,
  ): boolean {
    return this.preferenceService.shouldMulticlickClose(
      EnabledExtension.of(enabledExtension),
      EnabledMulticlickClose.of(enabledMulticlickClose),
      clickCount,
    );
  }

  getDisabledState(
    url: string,
    disabledDomain: string[],
    disabledDirectory: string[],
    disabledPage: string[],
    disabledOn: boolean,
  ): DisabledState {
    return this.preferenceService.getDisabledState(
      Url.href(url),
      disabledDomain.map((item) => DisabledDomain.of(item)),
      disabledDirectory.map((item) => DisabledDirectory.of(item)),
      disabledPage.map((item) => DisabledPage.of(item)),
      DisabledOn.of(disabledOn),
    );
  }
}
