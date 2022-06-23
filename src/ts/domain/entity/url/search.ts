import PrimitiveValueObject from '@/domain/entity/primitiveValueObject';

export default class Search extends PrimitiveValueObject<string> {
  static of(value: string): Search {
    return new this(value);
  }
}
