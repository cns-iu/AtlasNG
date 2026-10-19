import { TestBed } from '@angular/core/testing';
import { ContentDefinition } from '@atlasng/content-templates/types';
import { DataLoaderRegistry, DataLoader } from '@atlasng/content-templates/loaders';
import { DataParserRegistry } from '@atlasng/content-templates/parsers';
import { DefinitionRegistry } from '@atlasng/content-templates/definitions';
import {
  ContentTemplatesFeature,
  provideContentTemplates,
  withDataLoaders,
  withDataParsers,
  withDefinitions,
} from './providers';

class TestComponent {}

const definition: ContentDefinition = { name: 'test', component: TestComponent };
const loader: DataLoader = { load: () => 'value' };

function setup(...features: ContentTemplatesFeature[]): void {
  TestBed.configureTestingModule({ providers: [provideContentTemplates(...features)] });
}

describe('provideContentTemplates', () => {
  it('provides registries without any features', () => {
    setup();

    expect(TestBed.inject(DefinitionRegistry)).toBeInstanceOf(DefinitionRegistry);
    expect(TestBed.inject(DataLoaderRegistry)).toBeInstanceOf(DataLoaderRegistry);
    expect(TestBed.inject(DataParserRegistry)).toBeInstanceOf(DataParserRegistry);
  });

  it('registers definitions from arrays and factory records', async () => {
    setup(
      withDefinitions([definition]),
      withDefinitions({ lazy: async () => ({ name: 'lazy', component: TestComponent }) }),
    );
    const registry = TestBed.inject(DefinitionRegistry);

    await expect(registry.get('test')).resolves.toBe(definition);
    await expect(registry.get('lazy')).resolves.toEqual({ name: 'lazy', component: TestComponent });
  });

  it('registers loaders and parsers', async () => {
    const parser = { parse: (input: unknown) => input };
    setup(withDataLoaders({ http: () => loader }), withDataParsers({ json: () => parser }));

    await expect(TestBed.inject(DataLoaderRegistry).get('http')).resolves.toBe(loader);
    await expect(TestBed.inject(DataParserRegistry).get('json')).resolves.toBe(parser);
  });
});
