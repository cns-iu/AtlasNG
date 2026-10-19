import { createEnvironmentInjector, EnvironmentInjector, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Promisable } from 'type-fest';
import { DATA_PARSERS, DataParserRegistry, DataParser } from './data-parser-registry';

function providers(factories: Record<string, () => Promisable<DataParser>> = {}): Provider[] {
  return [{ provide: DATA_PARSERS, useValue: factories, multi: true }, DataParserRegistry];
}

function setup(factories?: Record<string, () => Promisable<DataParser>>): DataParserRegistry {
  TestBed.configureTestingModule({ providers: providers(factories) });
  return TestBed.inject(DataParserRegistry);
}

describe('DataParserRegistry', () => {
  it('creates parsers from async factories', async () => {
    const parser: DataParser = { parse: (input) => input };
    const registry = setup({ csv: async () => parser });

    await expect(registry.get('csv')).resolves.toBe(parser);
  });

  it('returns undefined for unknown parsers', () => {
    const registry = setup();

    expect(registry.get('missing')).toBeUndefined();
  });

  it('falls back to the parent registry', async () => {
    const parser: DataParser = { parse: (input) => input };
    setup({ csv: () => parser });
    const child = createEnvironmentInjector(providers(), TestBed.inject(EnvironmentInjector));

    await expect(child.get(DataParserRegistry).get('csv')).resolves.toBe(parser);
  });
});
