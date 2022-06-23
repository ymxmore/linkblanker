import OutputData from '@/usecase/core/outputData';

export default interface PreferenceGetOutputData extends OutputData {
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
