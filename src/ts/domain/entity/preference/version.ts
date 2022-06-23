import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Version extends PrimitiveValueObject<string> {
  static of(value: string): Version {
    return new this(value);
  }
}
