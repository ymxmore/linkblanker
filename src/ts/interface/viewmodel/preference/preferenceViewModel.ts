import { CLICK_POSITION as CLICK_POSITION_ORIGIN } from '@/domain/entity/preference/clickPosition';

export const CLICK_POSITION = CLICK_POSITION_ORIGIN;

export default interface PreferenceViewModel {
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
