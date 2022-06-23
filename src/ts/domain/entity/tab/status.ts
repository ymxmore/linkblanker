import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Status extends PrimitiveValueObject<string> {
  static of(value: string): Status {
    return new this(value);
  }
}
