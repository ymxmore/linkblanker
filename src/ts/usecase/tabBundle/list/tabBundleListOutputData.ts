import OutputData from '@/usecase/core/outputData';

export default interface TabBundleListOutputData extends OutputData {
  tabBundles: Array<{
    readonly id: number;
    readonly from: number;
    readonly direction: number;
    readonly time: number;
    readonly tabs: Array<{
      readonly pinned: boolean;
      readonly url: string;
    }>;
  }>;
}
