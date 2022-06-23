import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class VisibleLinkState extends PrimitiveValueObject<boolean> {
  static of(value: boolean): VisibleLinkState {
    return new this(value);
  }
}
