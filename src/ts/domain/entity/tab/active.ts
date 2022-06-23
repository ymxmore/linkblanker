import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Active extends PrimitiveValueObject<boolean> {
  static of(value: boolean): Active {
    return new this(value);
  }
}
