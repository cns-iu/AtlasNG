import { TestBed } from '@angular/core/testing';
import { ContentDataParserRegistry } from '../registries/data-parser-registry';
import { provideContentTemplates, withDataParsers } from '../registries/providers';
import { ContentDataContext } from '../types/content-data';
import { JsonContentDataParser } from './json-parser';

const context: ContentDataContext = { node: { component: 'test' }, signal: new AbortController().signal };
const config = { type: 'json' };

describe('JsonContentDataParser', () => {
  it('can be registered', async () => {
    TestBed.configureTestingModule({
      providers: [provideContentTemplates(withDataParsers({ json: () => new JsonContentDataParser() }))],
    });

    await expect(TestBed.inject(ContentDataParserRegistry).get('json')).resolves.toBeInstanceOf(JsonContentDataParser);
  });

  it('parses json strings', () => {
    expect(new JsonContentDataParser().parse('{"a":[1,"b",null]}', config, context)).toEqual({ a: [1, 'b', null] });
  });

  it('returns non-string input unchanged', () => {
    const input = { a: 1 };

    expect(new JsonContentDataParser().parse(input, config, context)).toBe(input);
  });

  it('throws for invalid json', () => {
    expect(() => new JsonContentDataParser().parse('{', config, context)).toThrow(SyntaxError);
  });
});
