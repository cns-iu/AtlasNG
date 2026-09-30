import { createEnvironmentInjector, EnvironmentInjector, inject, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContentDataLoader } from '../types/content-data';
import { ContentDataLoaderRegistry } from './data-loader-registry';
import { ContentTemplatesFeature, provideContentTemplates, withDataLoaders } from './providers';
import { CONTENT_DATA_LOADER_CONFIG } from './tokens';

const VALUE = new InjectionToken<string>('VALUE');

function setup(...features: ContentTemplatesFeature[]): ContentDataLoaderRegistry {
  TestBed.configureTestingModule({
    providers: [{ provide: VALUE, useValue: 'root' }, provideContentTemplates(...features)],
  });
  return TestBed.inject(ContentDataLoaderRegistry);
}

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

describe('ContentDataLoaderRegistry', () => {
  it('creates loaders once in the injection context', () => {
    const factory = vi.fn((): ContentDataLoader => {
      const value = inject(VALUE);
      return { load: () => value };
    });
    const registry = setup(withDataLoaders({ test: factory }));

    const loader = registry.get('test');

    expect(registry.get('test')).toBe(loader);
    expect(loader.load({ type: 'test' }, { node: { component: 'x' }, signal: new AbortController().signal })).toBe(
      'root',
    );
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('throws for unknown loaders', () => {
    const registry = setup();

    expect(() => registry.get('missing')).toThrow("Unknown data loader 'missing'.");
  });

  it('falls back to the parent registry, and the child inherits its config', () => {
    const loader: ContentDataLoader = { load: () => undefined };
    setup(withDataLoaders({ http: () => loader }, { defaultLoader: 'http' }));
    const child = createEnvironmentInjector([provideContentTemplates()], TestBed.inject(EnvironmentInjector));

    expect(child.get(ContentDataLoaderRegistry).get('http')).toBe(loader);
    expect(child.runInContext(CONTENT_DATA_LOADER_CONFIG.inject)).toEqual({ defaultLoader: 'http' });
  });

  it('throws in dev mode for duplicate names', () => {
    const loader: ContentDataLoader = { load: () => undefined };

    expect(() => setup(withDataLoaders({ http: () => loader }), withDataLoaders({ http: () => loader }))).toThrow(
      "Duplicate data loader 'http'.",
    );
  });

  it('lets the last registration win in prod mode', () => {
    const first: ContentDataLoader = { load: () => 1 };
    const second: ContentDataLoader = { load: () => 2 };
    const registry = runWithProdMode(() =>
      setup(withDataLoaders({ http: () => first }), withDataLoaders({ http: () => second })),
    );

    expect(registry.get('http')).toBe(second);
  });
});
