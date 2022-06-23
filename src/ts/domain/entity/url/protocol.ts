import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Protocol extends PrimitiveValueObject<string> {
  static of(value: string): Protocol {
    return new this(value);
  }
}
