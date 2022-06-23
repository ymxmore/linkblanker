import ValueObject from '@/domain/entity/valueObject';
import Focused from '@/domain/entity/window/focused';
import Id from '@/domain/entity/window/id';

interface WindowProps {
  focused: Focused;
  id: Id;
}

export default class Window extends ValueObject<WindowProps> {
  static of(props: WindowProps): Window {
    return new Window(props);
  }

  get focused(): Focused {
    return this.value.focused;
  }

  get id(): Id {
    return this.value.id;
  }
}
