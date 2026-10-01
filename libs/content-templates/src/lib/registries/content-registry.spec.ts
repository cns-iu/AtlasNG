import { createEnvironmentInjector, EnvironmentInjector, inject, Injectable, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Promisable } from 'type-fest';
import { ContentRegistry } from './content-registry';

const VALUE = new InjectionToken<string>('VALUE');
const ENTRIES = new InjectionToken<[string, () => Promisable<string>][]>('ENTRIES');

@Injectable()
class TestRegistry extends ContentRegistry<string> {
  constructor() {
    super(inject(TestRegistry, { optional: true, skipSelf: true }), inject(ENTRIES));
  }
}

function setup(entries: [string, () => Promisable<string>][]): TestRegistry {
  TestBed.configureTestingModule({
    providers: [{ provide: VALUE, useValue: 'root' }, { provide: ENTRIES, useValue: entries }, TestRegistry],
  });
  return TestBed.inject(TestRegistry);
}

function createChild(entries: [string, () => Promisable<string>][]): TestRegistry {
  const injector = createEnvironmentInjector(
    [{ provide: ENTRIES, useValue: entries }, TestRegistry],
    TestBed.inject(EnvironmentInjector),
  );
  return injector.get(TestRegistry);
}

describe('ContentRegistry', () => {
  it('resolves sync and async factories', async () => {
    const registry = setup([
      ['sync', () => 'a'],
      ['async', async () => 'b'],
    ]);

    await expect(registry.get('sync')).resolves.toBe('a');
    await expect(registry.get('async')).resolves.toBe('b');
  });

  it('runs factories once in the injection context', async () => {
    const factory = vi.fn(() => inject(VALUE));
    const registry = setup([['value', factory]]);

    const first = registry.get('value');
    const second = registry.get('value');

    expect(second).toBe(first);
    await expect(first).resolves.toBe('root');
    await expect(registry.get('value')).resolves.toBe('root');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('caches rejections without calling the factory again', async () => {
    const rejecting = vi.fn(async (): Promise<string> => {
      throw new Error('offline');
    });
    const throwing = vi.fn((): string => {
      throw new Error('broken');
    });
    const registry = setup([
      ['rejecting', rejecting],
      ['throwing', throwing],
    ]);

    await expect(registry.get('rejecting')).rejects.toThrow('offline');
    await expect(registry.get('rejecting')).rejects.toThrow('offline');
    await expect(registry.get('throwing')).rejects.toThrow('broken');
    await expect(registry.get('throwing')).rejects.toThrow('broken');
    expect(rejecting).toHaveBeenCalledTimes(1);
    expect(throwing).toHaveBeenCalledTimes(1);
  });

  it('falls back to the parent registry', async () => {
    const factory = vi.fn(() => 'parent');
    const parent = setup([['parent', factory]]);
    const parentGet = vi.spyOn(parent, 'get');
    const child = createChild([['child', () => 'child']]);

    await expect(child.get('parent')).resolves.toBe('parent');
    await expect(child.get('parent')).resolves.toBe('parent');
    await expect(child.get('child')).resolves.toBe('child');
    expect(parentGet).toHaveBeenCalledTimes(1);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('rejects unknown names', async () => {
    const registry = setup([]);

    await expect(registry.get('missing')).rejects.toThrow("Unknown registry entry 'missing'.");
  });

  it('lets the last registration win', async () => {
    const registry = setup([
      ['name', () => 'first'],
      ['name', () => 'second'],
    ]);

    await expect(registry.get('name')).resolves.toBe('second');
  });
});
