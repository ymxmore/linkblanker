import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class DisabledPage extends PrimitiveValueObject<string> {
  static of(value: string): DisabledPage {
    return new this(value);
  }
}
