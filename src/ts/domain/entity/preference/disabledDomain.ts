import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class DisabledDomain extends PrimitiveValueObject<string> {
  static of(value: string): DisabledDomain {
    return new this(value);
  }
}
