import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Password extends PrimitiveValueObject<string> {
  static of(value: string): Password {
    return new this(value);
  }
}
