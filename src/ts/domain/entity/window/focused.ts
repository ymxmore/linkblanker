import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Focused extends PrimitiveValueObject<boolean> {
  static of(value: boolean): Focused {
    return new this(value);
  }
}
