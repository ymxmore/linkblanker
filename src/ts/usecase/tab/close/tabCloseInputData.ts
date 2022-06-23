import InputData from '@/usecase/core/inputData';

export default interface TabCloseInputData extends InputData {
  readonly from: number;
  readonly direction: number;
}
