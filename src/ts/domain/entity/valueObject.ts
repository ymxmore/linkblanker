import AbstractValueObject from '@/domain/entity/abstractValueObject';

export default abstract class ValueObject<T> extends AbstractValueObject<T> {
  eq(value: ValueObject<T>): boolean {
    const oldKeys = Object.keys(this.value);
    const newKeys = Object.keys(value.value);

    oldKeys.sort();
    newKeys.sort();

    if (oldKeys.length !== newKeys.length) {
      return false;
    }

    for (let i = 0; i < oldKeys.length; i++) {
      if (oldKeys[i] !== newKeys[i]) {
        return false;
      }
    }

    const oldVals = Object.values(this.value);
    const newVals = Object.values(value.value);

    oldVals.sort();
    newVals.sort();

    if (oldVals.length !== newVals.length) {
      return false;
    }

    for (let i = 0; i < oldVals.length; i++) {
      if (oldVals[i] !== newVals[i]) {
        return false;
      }
    }

    return true;
  }
}
