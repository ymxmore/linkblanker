import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class ShortcutKeyToggleEnabled extends PrimitiveValueObject<number> {
  static of(value: number): ShortcutKeyToggleEnabled {
    return new this(value);
  }
}
