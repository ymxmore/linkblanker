import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Host extends PrimitiveValueObject<string> {
  static of(value: string): Host {
    return new this(value);
  }
}
