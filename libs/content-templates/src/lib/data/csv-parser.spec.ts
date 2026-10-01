import { TestBed } from '@angular/core/testing';
import { ContentDataParserRegistry } from '../registries/data-parser-registry';
import { provideContentTemplates, withDataParsers } from '../registries/providers';
import { ContentDataContext } from '../types/content-data';
import { CsvContentDataParser, CsvContentDataParserConfig } from './csv-parser';

const context: ContentDataContext = { node: { component: 'test' }, signal: new AbortController().signal };

function parse(input: unknown, config: Partial<CsvContentDataParserConfig> = {}) {
  return new CsvContentDataParser().parse(input, { type: 'csv', ...config }, context);
}

describe('CsvContentDataParser', () => {
  it('can be registered', async () => {
    TestBed.configureTestingModule({
      providers: [provideContentTemplates(withDataParsers({ csv: () => new CsvContentDataParser() }))],
    });

    await expect(TestBed.inject(ContentDataParserRegistry).get('csv')).resolves.toBeInstanceOf(CsvContentDataParser);
  });

  it('parses rows keyed by the header by default', () => {
    expect(parse('region,total\nnorth,10\nsouth,20\n')).toEqual([
      { region: 'north', total: '10' },
      { region: 'south', total: '20' },
    ]);
  });

  it('fills missing fields with empty strings and drops extra fields', () => {
    expect(parse('a,b\n1\n1,2,3')).toEqual([
      { a: '1', b: '' },
      { a: '1', b: '2' },
    ]);
  });

  it('returns arrays without a header', () => {
    expect(parse('a,b\n1,2', { header: false })).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('handles CRLF line endings and one trailing line break', () => {
    expect(parse('a,b\r\n1,2\r\n', { header: false })).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('keeps blank records other than the trailing line break', () => {
    expect(parse('a\n\n', { header: false })).toEqual([['a'], ['']]);
  });

  it('parses quoted fields with escaped quotes, delimiters, and line breaks', () => {
    expect(parse('"a ""b""","c,d","e\r\nf",""\n', { header: false })).toEqual([['a "b"', 'c,d', 'e\r\nf', '']]);
  });

  it('keeps quotes that do not start a field and text after a closing quote', () => {
    expect(parse('a"b,"c"d\r', { header: false })).toEqual([['a"b', 'cd\r']]);
  });

  it('keeps empty fields', () => {
    expect(parse(',,', { header: false })).toEqual([['', '', '']]);
  });

  it('supports custom delimiters', () => {
    expect(parse('a;b\n"1;2";3', { delimiter: ';' })).toEqual([{ a: '1;2', b: '3' }]);
  });

  it('returns no rows for empty text', () => {
    expect(parse('')).toEqual([]);
    expect(parse('\n', { header: false })).toEqual([]);
  });

  it('returns no rows for a header only', () => {
    expect(parse('a,b\n')).toEqual([]);
  });

  it('throws for non-string input', () => {
    expect(() => parse(42)).toThrow('CSV parser expects a string, got number.');
    expect(() => parse(null)).toThrow('CSV parser expects a string, got null.');
  });

  it('throws for an unterminated quote', () => {
    expect(() => parse('a,b\n1,"2\n3\n')).toThrow('Unterminated quoted CSV field starting on line 2.');
  });

  it.each([';;', '', '"', '\n', '\r'])('throws for the invalid delimiter %j', (delimiter) => {
    expect(() => parse('a', { delimiter })).toThrow(`Invalid CSV delimiter '${delimiter}'.`);
  });
});
