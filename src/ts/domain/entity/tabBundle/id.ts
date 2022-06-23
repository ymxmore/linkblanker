import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Id extends PrimitiveValueObject<number> {
  static of(value: number): Id {
    return new this(value);
  }
}
