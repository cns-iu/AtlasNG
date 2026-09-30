import { Component, ComponentMirror, input, reflectComponentType } from '@angular/core';
import { createInputBindings, createOptionalBindings } from './bindings';

@Component({ selector: 'ang-test', template: '' })
class TestComponent {
  readonly title = input<string>();
  readonly rows = input<unknown[]>();
  // eslint-disable-next-line @angular-eslint/no-input-rename -- aliases are matched by template name
  readonly aliased = input<string>(undefined, { alias: 'label' });
}

const mirror = reflectComponentType(TestComponent) as ComponentMirror<unknown>;

function runWithProdMode<T>(callback: () => T): T {
  const global = globalThis as Record<string, unknown>;
  const originalNgDevMode = global['ngDevMode'];
  global['ngDevMode'] = false;
  try {
    return callback();
  } finally {
    global['ngDevMode'] = originalNgDevMode;
  }
}

describe('createInputBindings', () => {
  it('binds config and data by input template name', () => {
    expect(createInputBindings(mirror, { title: 'a', label: 'b' }, { rows: [] }, 'test')).toHaveLength(3);
  });

  it('throws in dev mode for unknown keys and collisions', () => {
    expect(() => createInputBindings(mirror, { aliased: 'a' }, {}, 'test')).toThrow(
      "Component 'test' has no input for 'aliased'.",
    );
    expect(() => createInputBindings(mirror, { title: 'a' }, { title: 'b' }, 'test')).toThrow(
      "Component 'test' uses 'title' for both config and data.",
    );
  });

  it('skips unknown keys in prod mode', () => {
    expect(runWithProdMode(() => createInputBindings(mirror, { other: 1 }, { title: 'a' }, 'test'))).toHaveLength(1);
  });
});

describe('createOptionalBindings', () => {
  it('binds only declared inputs', () => {
    expect(createOptionalBindings(TestComponent, { title: 'a', node: {}, error: new Error() })).toHaveLength(1);
  });

  it('binds nothing for non-components', () => {
    expect(createOptionalBindings(class {}, { title: 'a' })).toEqual([]);
  });
});
