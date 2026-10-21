import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DefinitionRegistry } from '@atlasng/content-templates/definitions';
import { DataLoader, DataLoaderRegistry } from '@atlasng/content-templates/loaders';
import { DataParser, DataParserRegistry } from '@atlasng/content-templates/parsers';
import { ContentDefinition } from '@atlasng/content-templates/types';
import { CONTENT_TEMPLATES_CONFIG } from './config';
import { provideContentTemplates, withDataLoaders, withDataParsers, withDefinitions } from './providers';

@Component({ selector: 'ang-test-view', template: '' })
class TestView {}

const definition: ContentDefinition = { name: 'test', component: TestView };
const loader: DataLoader = { load: () => 'value' };
const parser: DataParser = { parse: (input) => input };

function injectConfig() {
  return TestBed.runInInjectionContext(CONTENT_TEMPLATES_CONFIG.inject);
}

describe('provideContentTemplates', () => {
  it('provides the default configuration', () => {
    TestBed.configureTestingModule({ providers: [provideContentTemplates()] });

    expect(injectConfig()).toEqual({
      defaultLoader: 'http',
      defaultInlineLoader: 'inline',
      defaultParser: 'passthrough',
    });
  });

  it('provides the given configuration', () => {
    const config = {
      defaultLoader: 'http',
      defaultInlineLoader: 'inline',
      defaultParser: 'json',
      textComponent: TestView,
      errorComponent: TestView,
    };
    TestBed.configureTestingModule({ providers: [provideContentTemplates(config)] });

    expect(injectConfig()).toEqual(config);
  });

  it('registers definitions, loaders, and parsers from features', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideContentTemplates(
          {},
          withDefinitions([definition]),
          withDataLoaders({ http: () => loader }),
          withDataParsers({ json: () => parser }),
        ),
      ],
    });

    await expect(TestBed.inject(DefinitionRegistry).get('test')).resolves.toBe(definition);
    await expect(TestBed.inject(DataLoaderRegistry).get('http')).resolves.toBe(loader);
    await expect(TestBed.inject(DataParserRegistry).get('json')).resolves.toBe(parser);
  });
});
