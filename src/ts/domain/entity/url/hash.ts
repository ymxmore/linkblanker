import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Hash extends PrimitiveValueObject<string> {
  static of(value: string): Hash {
    return new this(value);
  }
}
