import {
  createEnvironmentInjector,
  EnvironmentInjector,
  inject,
  Injectable,
  InjectionToken,
  Injector,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Promisable } from 'type-fest';
import { LazyChainedRegistry } from './lazy-chained-registry';

const VALUE = new InjectionToken<string>('VALUE');
const ENTRIES = new InjectionToken<[string, () => Promisable<string>][]>('ENTRIES');

@Injectable()
class TestRegistry extends LazyChainedRegistry<string> {
  constructor() {
    super(inject(Injector), inject(TestRegistry, { optional: true, skipSelf: true }), inject(ENTRIES));
  }
}

function setup(entries: [string, () => Promisable<string>][]): TestRegistry {
  TestBed.configureTestingModule({
    providers: [{ provide: VALUE, useValue: 'root' }, { provide: ENTRIES, useValue: entries }, TestRegistry],
  });
  return TestBed.inject(TestRegistry);
}

function createChildInjector(
  entries: [string, () => Promisable<string>][],
  parent = TestBed.inject(EnvironmentInjector),
): EnvironmentInjector {
  return createEnvironmentInjector([{ provide: ENTRIES, useValue: entries }, TestRegistry], parent);
}

function createChild(entries: [string, () => Promisable<string>][]): TestRegistry {
  return createChildInjector(entries).get(TestRegistry);
}

function createGrandchild(childEntries: [string, () => Promisable<string>][] = []): TestRegistry {
  return createChildInjector([], createChildInjector(childEntries)).get(TestRegistry);
}

describe('LazyChainedRegistry', () => {
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

  it('returns undefined for unknown names', () => {
    const registry = setup([]);

    expect(registry.get('missing')).toBeUndefined();
  });

  it('returns undefined for names unknown to the parent', () => {
    setup([['parent', () => 'parent']]);
    const child = createChild([]);

    expect(child.get('missing')).toBeUndefined();
  });

  it('lets the last registration win', async () => {
    const registry = setup([
      ['name', () => 'first'],
      ['name', () => 'second'],
    ]);

    await expect(registry.get('name')).resolves.toBe('second');
  });

  describe('has', () => {
    it('reports registered and unknown names', () => {
      const registry = setup([['name', () => 'name']]);

      expect(registry.has('name')).toBe(true);
      expect(registry.has('missing')).toBe(false);
    });

    it('reports names registered in an ancestor', () => {
      setup([['root', () => 'root']]);
      const grandchild = createGrandchild([['middle', () => 'middle']]);

      expect(grandchild.has('root')).toBe(true);
      expect(grandchild.has('middle')).toBe(true);
      expect(grandchild.has('missing')).toBe(false);
    });

    it('does not run the factory', () => {
      const factory = vi.fn(() => 'name');
      const registry = setup([['name', factory]]);

      registry.has('name');

      expect(factory).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('runs the factory again on the next get', async () => {
      const factory = vi.fn().mockReturnValueOnce('first').mockReturnValueOnce('second');
      const registry = setup([['name', factory]]);

      await expect(registry.get('name')).resolves.toBe('first');
      registry.reset('name');

      await expect(registry.get('name')).resolves.toBe('second');
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it('retries a cached rejection', async () => {
      const factory = vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce('online');
      const registry = setup([['name', factory]]);

      await expect(registry.get('name')).rejects.toThrow('offline');
      registry.reset('name');

      await expect(registry.get('name')).resolves.toBe('online');
    });

    it('keeps other cached values', async () => {
      const other = vi.fn(() => 'other');
      const registry = setup([
        ['name', () => 'name'],
        ['other', other],
      ]);
      await registry.get('name');
      await registry.get('other');

      registry.reset('name');
      await registry.get('other');

      expect(other).toHaveBeenCalledTimes(1);
    });

    it('lets an in-flight value resolve and starts a new one', async () => {
      const factory = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
      const registry = setup([['name', factory]]);

      const pending = registry.get('name');
      registry.reset('name');
      const next = registry.get('name');

      expect(next).not.toBe(pending);
      await expect(pending).resolves.toBe('first');
      await expect(next).resolves.toBe('second');
    });

    it('does not reset the parent registry', async () => {
      const factory = vi.fn(() => 'parent');
      setup([['parent', factory]]);
      const child = createChild([]);
      await child.get('parent');

      child.reset('parent');

      await expect(child.get('parent')).resolves.toBe('parent');
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('resets the name in every ancestor when recursive', async () => {
      const factory = vi.fn().mockReturnValueOnce('first').mockReturnValueOnce('second');
      const other = vi.fn(() => 'other');
      setup([
        ['root', factory],
        ['other', other],
      ]);
      const grandchild = createGrandchild();
      await grandchild.get('root');
      await grandchild.get('other');

      grandchild.reset('root', { recursive: true });

      await expect(grandchild.get('root')).resolves.toBe('second');
      await expect(grandchild.get('other')).resolves.toBe('other');
      expect(other).toHaveBeenCalledTimes(1);
    });

    it('ignores names without a cached value', async () => {
      const registry = setup([['name', () => 'name']]);

      expect(() => registry.reset('missing')).not.toThrow();
      expect(() => registry.reset('name')).not.toThrow();
      await expect(registry.get('name')).resolves.toBe('name');
    });
  });

  describe('clear', () => {
    it('runs every factory again on the next get', async () => {
      const first = vi.fn(() => 'first');
      const second = vi.fn(() => 'second');
      const registry = setup([
        ['first', first],
        ['second', second],
      ]);
      await registry.get('first');
      await registry.get('second');

      registry.clear();

      await expect(registry.get('first')).resolves.toBe('first');
      await expect(registry.get('second')).resolves.toBe('second');
      expect(first).toHaveBeenCalledTimes(2);
      expect(second).toHaveBeenCalledTimes(2);
    });

    it('does not clear the parent registry', async () => {
      const factory = vi.fn(() => 'parent');
      const parent = setup([['parent', factory]]);
      const child = createChild([]);
      await child.get('parent');

      child.clear();

      await expect(child.get('parent')).resolves.toBe('parent');
      await expect(parent.get('parent')).resolves.toBe('parent');
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('clears every ancestor when recursive', async () => {
      const root = vi.fn(() => 'root');
      const middle = vi.fn(() => 'middle');
      setup([['root', root]]);
      const grandchild = createGrandchild([['middle', middle]]);
      await grandchild.get('root');
      await grandchild.get('middle');

      grandchild.clear({ recursive: true });
      await grandchild.get('root');
      await grandchild.get('middle');

      expect(root).toHaveBeenCalledTimes(2);
      expect(middle).toHaveBeenCalledTimes(2);
    });
  });
});
