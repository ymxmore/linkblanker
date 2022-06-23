import OutputData from '@/usecase/core/outputData';

export default interface TabCloseOutputData extends OutputData {
  readonly id: number;
  readonly from: number;
}
