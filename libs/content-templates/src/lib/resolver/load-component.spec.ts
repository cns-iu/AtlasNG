import { Component } from '@angular/core';
import { loadComponent } from './load-component';

@Component({ selector: 'ang-test', template: '' })
class TestComponent {}

describe('loadComponent', () => {
  it('returns component classes as is', async () => {
    await expect(loadComponent(TestComponent)).resolves.toBe(TestComponent);
  });

  it('resolves loaders returning a class or a default export', async () => {
    await expect(loadComponent(() => TestComponent)).resolves.toBe(TestComponent);
    await expect(loadComponent(async () => ({ default: TestComponent }))).resolves.toBe(TestComponent);
  });

  it('rejects loaders that do not resolve to a component', async () => {
    await expect(loadComponent(() => class NotAComponent {})).rejects.toThrow(
      'Component loader did not resolve to a component.',
    );
  });
});
