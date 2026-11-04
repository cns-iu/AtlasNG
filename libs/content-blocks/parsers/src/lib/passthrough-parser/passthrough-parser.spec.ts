import { inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DATA_PARSERS, DataParserContext, DataParserRegistry } from '../data-parser-registry';
import { PassthroughDataParser } from './passthrough-parser';

const context: DataParserContext = {
  node: { component: 'test' },
  path: 'content',
  key: 'rows',
  signal: new AbortController().signal,
};
const config = { type: 'passthrough' };

describe('PassthroughDataParser', () => {
  it('can be registered', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DATA_PARSERS, useValue: { passthrough: () => inject(PassthroughDataParser) }, multi: true },
        DataParserRegistry,
      ],
    });

    await expect(TestBed.inject(DataParserRegistry).get('passthrough')).resolves.toBeInstanceOf(PassthroughDataParser);
  });

  it.each([{ a: 1 }, 'text', 42, null, undefined])('returns %j unchanged', (input) => {
    expect(new PassthroughDataParser().parse(input, config, context)).toBe(input);
  });
});
