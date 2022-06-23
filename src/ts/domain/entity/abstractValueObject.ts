export default abstract class AbstractValueObject<T> {
  public readonly value: T;

  protected constructor(value: T) {
    this.value = Object.freeze(value);
  }

  toJSON(): any {
    return this.value;
  }

  abstract eq(value: AbstractValueObject<T>): boolean;
}
