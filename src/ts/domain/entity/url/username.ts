import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Username extends PrimitiveValueObject<string> {
  static of(value: string): Username {
    return new this(value);
  }
}
