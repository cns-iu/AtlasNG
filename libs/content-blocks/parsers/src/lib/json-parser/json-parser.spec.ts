import { inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DATA_PARSERS, DataParserRegistry, DataParserContext } from '../data-parser-registry';
import { JsonDataParser } from './json-parser';

const context: DataParserContext = {
  node: { component: 'test' },
  path: 'content',
  key: 'rows',
  signal: new AbortController().signal,
};
const config = { type: 'json' };

describe('JsonDataParser', () => {
  it('can be registered', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DATA_PARSERS, useValue: { json: () => inject(JsonDataParser) }, multi: true },
        DataParserRegistry,
      ],
    });

    await expect(TestBed.inject(DataParserRegistry).get('json')).resolves.toBeInstanceOf(JsonDataParser);
  });

  it('parses json strings', () => {
    expect(new JsonDataParser().parse('{"a":[1,"b",null]}', config, context)).toEqual({ a: [1, 'b', null] });
  });

  it('returns non-string input unchanged', () => {
    const input = { a: 1 };

    expect(new JsonDataParser().parse(input, config, context)).toBe(input);
  });

  it('throws for invalid json', () => {
    expect(() => new JsonDataParser().parse('{', config, context)).toThrow(SyntaxError);
  });
});
