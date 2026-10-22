import { createEnvironmentInjector, EnvironmentInjector, inject, InjectionToken, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Promisable } from 'type-fest';
import { DATA_LOADERS, DataLoaderRegistry, DataLoader } from './data-loader-registry';
import { HttpDataLoader } from './http-loader/http-loader';
import { InlineDataLoader } from './inline-loader/inline-loader';

const VALUE = new InjectionToken<string>('VALUE');

function providers(factories: Record<string, () => Promisable<DataLoader>> = {}): Provider[] {
  return [{ provide: DATA_LOADERS, useValue: factories, multi: true }, DataLoaderRegistry];
}

function setup(factories?: Record<string, () => Promisable<DataLoader>>): DataLoaderRegistry {
  TestBed.configureTestingModule({
    providers: [{ provide: VALUE, useValue: 'root' }, providers(factories)],
  });
  return TestBed.inject(DataLoaderRegistry);
}

describe('DataLoaderRegistry', () => {
  it('creates loaders from async factories in the injection context', async () => {
    const registry = setup({
      test: async (): Promise<DataLoader> => {
        const value = inject(VALUE);
        return { load: () => value };
      },
    });

    const loader = await registry.get('test');

    expect(
      loader?.load(
        { type: 'test' },
        { node: { component: 'x' }, path: 'content', key: 'rows', signal: new AbortController().signal },
      ),
    ).toBe('root');
  });

  it('returns undefined for unknown loaders', () => {
    const registry = setup();

    expect(registry.get('missing')).toBeUndefined();
  });

  it('falls back to the parent registry', async () => {
    const loader: DataLoader = { load: () => undefined };
    setup({ http: () => loader });
    const child = createEnvironmentInjector(providers(), TestBed.inject(EnvironmentInjector));

    await expect(child.get(DataLoaderRegistry).get('http')).resolves.toBe(loader);
  });

  it('provides the built-in loaders at the root', async () => {
    const registry = setup();

    await expect(registry.get('http')).resolves.toBeInstanceOf(HttpDataLoader);
    await expect(registry.get('inline')).resolves.toBeInstanceOf(InlineDataLoader);
  });

  it('lets registered loaders replace built-ins', async () => {
    const loader: DataLoader = { load: () => undefined };
    const registry = setup({ http: () => loader });

    await expect(registry.get('http')).resolves.toBe(loader);
  });

  it('does not add the built-ins again in child registries', async () => {
    const loader: DataLoader = { load: () => undefined };
    setup({ http: () => loader });
    const child = createEnvironmentInjector(providers(), TestBed.inject(EnvironmentInjector));

    await expect(child.get(DataLoaderRegistry).get('http')).resolves.toBe(loader);
  });
});
