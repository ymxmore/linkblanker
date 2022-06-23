import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class DisabledOn extends PrimitiveValueObject<boolean> {
  static of(value: boolean): DisabledOn {
    return new this(value);
  }
}
