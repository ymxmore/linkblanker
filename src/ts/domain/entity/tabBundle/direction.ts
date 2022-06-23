import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export const DIRECTION = {
  NONE: 0,
  LEFT: 1,
  RIGHT: 2,
} as const;

export default class Direction extends PrimitiveValueObject<number> {
  static of(value: number): Direction {
    return new this(value);
  }
}
