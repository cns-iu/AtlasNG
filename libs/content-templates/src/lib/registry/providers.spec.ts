import { TestBed } from '@angular/core/testing';
import { ContentComponentDefinition } from '../types/content-component-definition';
import { ContentDataLoader } from '../types/content-data';
import { ContentDataLoaderRegistry } from './data-loader-registry';
import { ContentDataParserRegistry } from './data-parser-registry';
import { ContentDefinitionRegistry } from './definition-registry';
import {
  ContentTemplatesFeature,
  provideContentTemplates,
  withDataLoaders,
  withDataParsers,
  withDefinitions,
  withLazyDefinitions,
} from './providers';
import { CONTENT_DATA_LOADER_CONFIG } from './tokens';

class TestComponent {}

const definition: ContentComponentDefinition = { name: 'test', component: TestComponent };
const loader: ContentDataLoader = { load: () => 'value' };

function setup(...features: ContentTemplatesFeature[]): void {
  TestBed.configureTestingModule({ providers: [provideContentTemplates(...features)] });
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

describe('provideContentTemplates', () => {
  it('provides registries and default config without any features', () => {
    setup();

    expect(TestBed.inject(ContentDefinitionRegistry)).toBeInstanceOf(ContentDefinitionRegistry);
    expect(TestBed.inject(ContentDataLoaderRegistry)).toBeInstanceOf(ContentDataLoaderRegistry);
    expect(TestBed.inject(ContentDataParserRegistry)).toBeInstanceOf(ContentDataParserRegistry);
    expect(TestBed.runInInjectionContext(CONTENT_DATA_LOADER_CONFIG.inject)).toEqual({});
  });

  it('registers definitions from withDefinitions and withLazyDefinitions', async () => {
    setup(
      withDefinitions([definition]),
      withLazyDefinitions({ lazy: () => ({ name: 'lazy', component: TestComponent }) }),
    );
    const registry = TestBed.inject(ContentDefinitionRegistry);

    await expect(registry.get('test')).resolves.toBe(definition);
    await expect(registry.get('lazy')).resolves.toEqual({ name: 'lazy', component: TestComponent });
  });

  it('registers loaders, parsers, and the loader config', () => {
    const parser = { parse: (input: unknown) => input };
    setup(withDataLoaders({ http: () => loader }, { defaultLoader: 'http' }), withDataParsers({ csv: () => parser }));

    expect(TestBed.inject(ContentDataLoaderRegistry).get('http')).toBe(loader);
    expect(TestBed.inject(ContentDataParserRegistry).get('csv')).toBe(parser);
    expect(TestBed.runInInjectionContext(CONTENT_DATA_LOADER_CONFIG.inject)).toEqual({ defaultLoader: 'http' });
  });

  it('throws in dev mode when more than one loader config is provided', () => {
    expect(() =>
      provideContentTemplates(withDataLoaders({ a: () => loader }, {}), withDataLoaders({ b: () => loader }, {})),
    ).toThrow('Only one data loader configuration can be provided.');
  });

  it('skips the loader config check in prod mode', () => {
    expect(() =>
      runWithProdMode(() =>
        provideContentTemplates(withDataLoaders({ a: () => loader }, {}), withDataLoaders({ b: () => loader }, {})),
      ),
    ).not.toThrow();
  });
});

describe('withDataLoaders', () => {
  it('throws in dev mode when the default loader is not registered', () => {
    expect(() => withDataLoaders({ http: () => loader }, { defaultLoader: 'missing' })).toThrow(
      "Default data loader 'missing' is not registered.",
    );
  });

  it('skips the default loader check in prod mode', () => {
    expect(() => runWithProdMode(() => withDataLoaders({}, { defaultLoader: 'missing' }))).not.toThrow();
  });
});
