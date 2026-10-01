import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContentDataParser } from '../types/content-data';
import { ContentDataParserRegistry } from './data-parser-registry';
import { ContentTemplatesFeature, provideContentTemplates, withDataParsers } from './providers';

function setup(...features: ContentTemplatesFeature[]): ContentDataParserRegistry {
  TestBed.configureTestingModule({ providers: [provideContentTemplates(...features)] });
  return TestBed.inject(ContentDataParserRegistry);
}

describe('ContentDataParserRegistry', () => {
  it('creates parsers from async factories', async () => {
    const parser: ContentDataParser = { parse: (input) => input };
    const registry = setup(withDataParsers({ csv: async () => parser }));

    await expect(registry.get('csv')).resolves.toBe(parser);
  });

  it('rejects unknown parsers', async () => {
    const registry = setup();

    await expect(registry.get('missing')).rejects.toThrow("Unknown registry entry 'missing'.");
  });

  it('falls back to the parent registry', async () => {
    const parser: ContentDataParser = { parse: (input) => input };
    setup(withDataParsers({ csv: () => parser }));
    const child = createEnvironmentInjector([provideContentTemplates()], TestBed.inject(EnvironmentInjector));

    await expect(child.get(ContentDataParserRegistry).get('csv')).resolves.toBe(parser);
  });
});
