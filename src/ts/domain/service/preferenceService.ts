import DisabledDirectory from '../entity/preference/disabledDirectory';
import DisabledDomain from '../entity/preference/disabledDomain';
import DisabledOn from '../entity/preference/disabledOn';
import DisabledPage from '../entity/preference/disabledPage';
import DisabledSameDomain from '../entity/preference/disabledSameDomain';
import EnabledExtension from '../entity/preference/enabledExtension';
import EnabledMulticlickClose from '../entity/preference/enabledMulticlickClose';
import ClickPosition, {
  CLICK_POSITION,
} from '@/domain/entity/preference/clickPosition';
import Url from '@/domain/entity/url/url';

export const DISABLED_STATE = {
  OFF: 1,
  DOMAIN: 2,
  DIRECTORY: 3,
  PAGE: 4,
  ON: 5,
} as const;

export type DisabledState = typeof DISABLED_STATE[keyof typeof DISABLED_STATE];

export default class PreferenceService {
  shouldOpenTab(
    from: Url,
    to: Url,
    enabledExtension: EnabledExtension,
    disabledDomain: DisabledDomain[],
    disabledDirectory: DisabledDirectory[],
    disabledPage: DisabledPage[],
    disabledOn: DisabledOn,
    disabledSameDomain: DisabledSameDomain,
    clickPosition: ClickPosition,
    hasOnClick: boolean,
    eventType: string,
    button: number,
  ): boolean {
    if (!from.value || !to.value) {
      return false;
    }

    if (!this.enabledUrl(from)) {
      return false;
    }

    if (hasOnClick) {
      return false;
    }

    if (!enabledExtension.value) {
      return false;
    }

    const cp = this.matchClickPosition(clickPosition, eventType, button);

    if (!cp) {
      return false;
    }

    if (
      this.getDisabledState(
        from,
        disabledDomain,
        disabledDirectory,
        disabledPage,
        disabledOn,
      ) !== DISABLED_STATE.OFF
    ) {
      return false;
    }

    const sameDomain = from.host.eq(to.host);

    if (disabledSameDomain.value && sameDomain) {
      return false;
    }

    if (sameDomain && to.hash.value !== '') {
      return false;
    }

    if (to.href.value.match(/javascript:/i)) {
      return false;
    }

    return true;
  }

  getDisabledState(
    url: Url,
    disabledDomain: DisabledDomain[],
    disabledDirectory: DisabledDirectory[],
    disabledPage: DisabledPage[],
    disabledOn: DisabledOn,
  ): DisabledState {
    if (disabledOn.value) {
      return DISABLED_STATE.ON;
    }

    if (this.matchDomains(url, disabledDomain)) {
      return DISABLED_STATE.DOMAIN;
    }

    if (this.matchDirectories(url, disabledDirectory)) {
      return DISABLED_STATE.DIRECTORY;
    }

    if (this.matchPages(url, disabledPage)) {
      return DISABLED_STATE.PAGE;
    }

    return DISABLED_STATE.OFF;
  }

  shouldMulticlickClose(
    enabledExtension: EnabledExtension,
    enabledMulticlickClose: EnabledMulticlickClose,
    clickCount: number,
  ): boolean {
    return (
      enabledExtension.value && enabledMulticlickClose.value && clickCount === 3
    );
  }

  /**
   * 指定されたURLが有効か
   *
   * @param url URL
   * @return 動作可能: true
   */
  enabledUrl(url: Url): boolean {
    const m =
      /^chrome:\/\/(.*)$/.test(url.href.value) ||
      /^https:\/\/chrome\.google\.com\/webstore(.*)$/.test(url.href.value);
    return !m;
  }

  /**
   * 指定されたURLで拡張機能が動作可能か
   *
   * @param url
   * @param enabledExtension
   * @param disabledDomain
   * @param disabledDirectory
   * @param disabledPage
   * @param disabledOn
   * @returns
   */
  enabledOpenFromUrl(
    url: Url,
    enabledExtension: EnabledExtension,
    disabledDomain: DisabledDomain[],
    disabledDirectory: DisabledDirectory[],
    disabledPage: DisabledPage[],
    disabledOn: DisabledOn,
  ): boolean {
    return (
      enabledExtension.value &&
      this.enabledUrl(url) &&
      this.getDisabledState(
        url,
        disabledDomain,
        disabledDirectory,
        disabledPage,
        disabledOn,
      ) === DISABLED_STATE.OFF
    );
  }

  private matchDomains(url: Url, disabledDomain: DisabledDomain[]): boolean {
    for (let i = 0; i < disabledDomain.length; i++) {
      if (disabledDomain[i].value === url.host.value) {
        return true;
      }
    }

    return false;
  }

  private matchDirectories(
    url: Url,
    disabledDirectory: DisabledDirectory[],
  ): boolean {
    for (let i = 0; i < disabledDirectory.length; i++) {
      if (
        url.href.value.match(new RegExp(`^${disabledDirectory[i].value}/.+$`))
      ) {
        return true;
      }
    }

    return false;
  }

  private matchPages(url: Url, disabledPage: DisabledPage[]): boolean {
    for (let i = 0; i < disabledPage.length; i++) {
      if (disabledPage[i].value === url.href.value) {
        return true;
      }
    }

    return false;
  }

  /**
   * 指定されたマウスイベントとクリックポジションがマッチしているか
   *
   * @param clickPosition クリックボタン
   * @param eventType イベントタイプ
   * @param button クリックされたボタン
   * @returns 結果
   */
  private matchClickPosition(
    clickPosition: ClickPosition,
    eventType: string,
    button: number,
  ): boolean {
    return (
      (clickPosition.value & CLICK_POSITION.LEFT &&
        button === 0 &&
        eventType === 'click') ||
      (clickPosition.value & CLICK_POSITION.MIDDLE &&
        button === 1 &&
        eventType === 'mousedown') ||
      (clickPosition.value & CLICK_POSITION.RIGHT &&
        button === 2 &&
        eventType === 'contextmenu')
    );
  }
}
