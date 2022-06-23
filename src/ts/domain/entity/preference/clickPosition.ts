import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export const CLICK_POSITION = {
  NONE: 0,
  LEFT: 1 << 0,
  MIDDLE: 1 << 1,
  RIGHT: 1 << 2,
} as const;

export default class ClickPosition extends PrimitiveValueObject<number> {
  static of(value: number): ClickPosition {
    return new this(value);
  }
}
