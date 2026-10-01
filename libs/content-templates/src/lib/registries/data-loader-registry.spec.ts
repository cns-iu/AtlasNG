import { createEnvironmentInjector, EnvironmentInjector, inject, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContentDataLoader } from '../types/content-data';
import { CONTENT_DATA_LOADER_CONFIG, ContentDataLoaderRegistry } from './data-loader-registry';
import { ContentTemplatesFeature, provideContentTemplates, withDataLoaders } from './providers';

const VALUE = new InjectionToken<string>('VALUE');

function setup(...features: ContentTemplatesFeature[]): ContentDataLoaderRegistry {
  TestBed.configureTestingModule({
    providers: [{ provide: VALUE, useValue: 'root' }, provideContentTemplates(...features)],
  });
  return TestBed.inject(ContentDataLoaderRegistry);
}

describe('ContentDataLoaderRegistry', () => {
  it('creates loaders from async factories in the injection context', async () => {
    const registry = setup(
      withDataLoaders({
        test: async (): Promise<ContentDataLoader> => {
          const value = inject(VALUE);
          return { load: () => value };
        },
      }),
    );

    const loader = await registry.get('test');

    expect(loader.load({ type: 'test' }, { node: { component: 'x' }, signal: new AbortController().signal })).toBe(
      'root',
    );
  });

  it('rejects unknown loaders', async () => {
    const registry = setup();

    await expect(registry.get('missing')).rejects.toThrow("Unknown registry entry 'missing'.");
  });

  it('falls back to the parent registry, and the child inherits its config', async () => {
    const loader: ContentDataLoader = { load: () => undefined };
    setup(withDataLoaders({ http: () => loader }, { defaultLoader: 'http' }));
    const child = createEnvironmentInjector([provideContentTemplates()], TestBed.inject(EnvironmentInjector));

    await expect(child.get(ContentDataLoaderRegistry).get('http')).resolves.toBe(loader);
    expect(child.runInContext(CONTENT_DATA_LOADER_CONFIG.inject)).toEqual({ defaultLoader: 'http' });
  });
});
