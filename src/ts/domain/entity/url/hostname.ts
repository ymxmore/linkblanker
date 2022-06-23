import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Hostname extends PrimitiveValueObject<string> {
  static of(value: string): Hostname {
    return new this(value);
  }
}
