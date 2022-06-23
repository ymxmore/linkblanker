import OutputData from '@/usecase/core/outputData';

export default interface OutputPort<T extends OutputData> {
  execute(data: T);
}
