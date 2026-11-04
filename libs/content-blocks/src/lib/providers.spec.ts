import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DefinitionRegistry } from '@atlasng/content-blocks/definitions';
import { DataLoader, DataLoaderRegistry } from '@atlasng/content-blocks/loaders';
import { DataParser, DataParserRegistry } from '@atlasng/content-blocks/parsers';
import { ContentDefinition } from '@atlasng/content-blocks/types';
import { CONTENT_BLOCKS_CONFIG } from './config';
import { provideContentBlocks, withDataLoaders, withDataParsers, withDefinitions } from './providers';

@Component({ selector: 'ang-test-view', template: '' })
class TestView {}

const definition: ContentDefinition = { name: 'test', component: TestView };
const loader: DataLoader = { load: () => 'value' };
const parser: DataParser = { parse: (input) => input };

function injectConfig() {
  return TestBed.runInInjectionContext(CONTENT_BLOCKS_CONFIG.inject);
}

describe('provideContentBlocks', () => {
  it('provides the default configuration', () => {
    TestBed.configureTestingModule({ providers: [provideContentBlocks()] });

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
    TestBed.configureTestingModule({ providers: [provideContentBlocks(config)] });

    expect(injectConfig()).toEqual(config);
  });

  it('registers definitions, loaders, and parsers from features', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideContentBlocks(
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
