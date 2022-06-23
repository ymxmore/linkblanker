import InputData from '@/usecase/core/inputData';

export default interface InputPort<T extends InputData> {
  execute(data: T);
}
