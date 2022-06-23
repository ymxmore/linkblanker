import AbstractValueObject from '@/domain/entity/abstractValueObject';

export default abstract class PrimitiveValueObject<
  T,
> extends AbstractValueObject<T> {
  eq(value: PrimitiveValueObject<T>): boolean {
    return this.value === value.value;
  }
}
