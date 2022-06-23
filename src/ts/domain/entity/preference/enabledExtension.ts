import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class EnabledExtension extends PrimitiveValueObject<boolean> {
  static of(value: boolean): EnabledExtension {
    return new this(value);
  }
}
