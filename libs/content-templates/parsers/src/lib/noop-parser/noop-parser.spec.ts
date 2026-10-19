import { inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DATA_PARSERS, DataParserContext, DataParserRegistry } from '../data-parser-registry';
import { NoopDataParser } from './noop-parser';

const context: DataParserContext = { node: { component: 'test' }, signal: new AbortController().signal };
const config = { type: 'noop' };

describe('NoopDataParser', () => {
  it('can be registered', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DATA_PARSERS, useValue: { noop: () => inject(NoopDataParser) }, multi: true },
        DataParserRegistry,
      ],
    });

    await expect(TestBed.inject(DataParserRegistry).get('noop')).resolves.toBeInstanceOf(NoopDataParser);
  });

  it.each([{ a: 1 }, 'text', 42, null, undefined])('returns %j unchanged', (input) => {
    expect(new NoopDataParser().parse(input, config, context)).toBe(input);
  });
});
