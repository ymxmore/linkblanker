import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class EnabledMulticlickClose extends PrimitiveValueObject<boolean> {
  static of(value: boolean): EnabledMulticlickClose {
    return new this(value);
  }
}
