import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Href extends PrimitiveValueObject<string> {
  static of(value: string): Href {
    return new this(value);
  }
}
