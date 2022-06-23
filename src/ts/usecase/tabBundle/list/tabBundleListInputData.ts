import InputData from '@/usecase/core/inputData';

export default interface TabBundleListInputData extends InputData {
  readonly from: number;
  readonly min: number;
}
