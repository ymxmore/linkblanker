import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Directory extends PrimitiveValueObject<string> {
  static of(value: string): Directory {
    return new this(value);
  }
}
