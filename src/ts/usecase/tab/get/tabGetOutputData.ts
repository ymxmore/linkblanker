import OutputData from '@/usecase/core/outputData';

export default interface TabGetOutputData extends OutputData {
  readonly tab: {
    readonly active: boolean;
    readonly id: number;
    readonly index: number;
    readonly pinned: boolean;
    readonly status: string;
    readonly title: string;
    readonly url: {
      readonly hash: string;
      readonly host: string;
      readonly hostname: string;
      readonly href: string;
      readonly origin: string;
      readonly password: string;
      readonly pathname: string;
      readonly port: string;
      readonly protocol: string;
      readonly search: string;
      readonly username: string;
      readonly directory: string;
    };
    readonly windowId: number;
  };
  readonly preference: {
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
  };
}
