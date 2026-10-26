import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DataParser, DataParserRegistry } from './data-parser-registry';
import { provideDataParsers } from './providers';

const first: DataParser = { parse: (input) => input };
const second: DataParser = { parse: (input) => input };

describe('provideDataParsers', () => {
  it('provides a registry with the given parsers', async () => {
    TestBed.configureTestingModule({ providers: [provideDataParsers({ json: () => first })] });

    await expect(TestBed.inject(DataParserRegistry).get('json')).resolves.toBe(first);
  });

  it('merges parsers from several calls', async () => {
    TestBed.configureTestingModule({
      providers: [provideDataParsers({ a: () => first }), provideDataParsers({ b: () => second })],
    });
    const registry = TestBed.inject(DataParserRegistry);

    await expect(registry.get('a')).resolves.toBe(first);
    await expect(registry.get('b')).resolves.toBe(second);
  });

  it('adds parsers in a child injector on top of the parent', async () => {
    TestBed.configureTestingModule({ providers: [provideDataParsers({ a: () => first })] });
    const child = createEnvironmentInjector(
      [provideDataParsers({ b: () => second })],
      TestBed.inject(EnvironmentInjector),
    );
    const registry = child.get(DataParserRegistry);

    expect(registry).not.toBe(TestBed.inject(DataParserRegistry));
    await expect(registry.get('a')).resolves.toBe(first);
    await expect(registry.get('b')).resolves.toBe(second);
  });
});
