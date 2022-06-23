import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Title extends PrimitiveValueObject<string> {
  static of(value: string): Title {
    return new this(value);
  }
}
