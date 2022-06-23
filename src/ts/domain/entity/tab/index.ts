import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Index extends PrimitiveValueObject<number> {
  static of(value: number): Index {
    return new this(value);
  }
}
