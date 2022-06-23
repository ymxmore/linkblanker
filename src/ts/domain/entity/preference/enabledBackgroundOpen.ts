import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class EnabledBackgroundOpen extends PrimitiveValueObject<boolean> {
  static of(value: boolean): EnabledBackgroundOpen {
    return new this(value);
  }
}
