import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class NoCloseFixedTab extends PrimitiveValueObject<boolean> {
  static of(value: boolean): NoCloseFixedTab {
    return new this(value);
  }
}
