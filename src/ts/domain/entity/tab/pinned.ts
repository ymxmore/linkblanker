import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Pinned extends PrimitiveValueObject<boolean> {
  static of(value: boolean): Pinned {
    return new this(value);
  }
}
