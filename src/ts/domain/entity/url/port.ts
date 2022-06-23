import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Port extends PrimitiveValueObject<string> {
  static of(value: string): Port {
    return new this(value);
  }
}
