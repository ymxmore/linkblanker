import OutputData from '@/usecase/core/outputData';

export default interface TabListOutputData extends OutputData {
  readonly tabs: Array<{
    readonly id: number;
    readonly pinned: boolean;
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
    readonly active: boolean;
    readonly index: number;
    readonly status: string;
    readonly title: string;
    readonly windowId: number;
  }>;
}
