import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Pathname extends PrimitiveValueObject<string> {
  static of(value: string): Pathname {
    return new this(value);
  }
}
