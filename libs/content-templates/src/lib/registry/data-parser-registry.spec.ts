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
  it('creates parsers once', () => {
    const parser: ContentDataParser = { parse: (input) => input };
    const factory = vi.fn(() => parser);
    const registry = setup(withDataParsers({ csv: factory }));

    expect(registry.get('csv')).toBe(parser);
    expect(registry.get('csv')).toBe(parser);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('throws for unknown parsers', () => {
    const registry = setup();

    expect(() => registry.get('missing')).toThrow("Unknown data parser 'missing'.");
  });

  it('falls back to the parent registry', () => {
    const parser: ContentDataParser = { parse: (input) => input };
    setup(withDataParsers({ csv: () => parser }));
    const child = createEnvironmentInjector([provideContentTemplates()], TestBed.inject(EnvironmentInjector));

    expect(child.get(ContentDataParserRegistry).get('csv')).toBe(parser);
  });
});
