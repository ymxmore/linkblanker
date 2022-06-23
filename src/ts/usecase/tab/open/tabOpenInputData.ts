import InputData from '@/usecase/core/inputData';

export default interface TabOpenInputData extends InputData {
  from: number;
  urls: string[];
}
