import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Time extends PrimitiveValueObject<number> {
  static of(value: number): Time {
    return new this(value);
  }
}
