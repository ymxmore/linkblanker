import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class DisabledSameDomain extends PrimitiveValueObject<boolean> {
  static of(value: boolean): DisabledSameDomain {
    return new this(value);
  }
}
