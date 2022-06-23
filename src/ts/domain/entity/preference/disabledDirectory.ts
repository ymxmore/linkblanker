import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class DisabledDirectory extends PrimitiveValueObject<string> {
  static of(value: string): DisabledDirectory {
    return new this(value);
  }
}
