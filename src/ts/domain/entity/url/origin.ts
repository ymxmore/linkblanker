import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Origin extends PrimitiveValueObject<string> {
  static of(value: string): Origin {
    return new this(value);
  }
}
