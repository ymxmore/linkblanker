import InputData from '@/usecase/core/inputData';

export default interface TabBundleUndoInputData extends InputData {
  readonly from: number;
  readonly id: number;
}
