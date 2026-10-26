import { createEnvironmentInjector, EnvironmentInjector, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Promisable } from 'type-fest';
import { DATA_PARSERS, DataParserRegistry, DataParser } from './data-parser-registry';
import { JsonDataParser } from './json-parser/json-parser';
import { PassthroughDataParser } from './passthrough-parser/passthrough-parser';

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

  it('provides the built-in parsers at the root', async () => {
    const registry = setup();

    await expect(registry.get('json')).resolves.toBeInstanceOf(JsonDataParser);
    await expect(registry.get('passthrough')).resolves.toBeInstanceOf(PassthroughDataParser);
  });

  it('lets registered parsers replace built-ins', async () => {
    const parser: DataParser = { parse: (input) => input };
    const registry = setup({ json: () => parser });

    await expect(registry.get('json')).resolves.toBe(parser);
  });

  it('does not add the built-ins again in child registries', async () => {
    const parser: DataParser = { parse: (input) => input };
    setup({ json: () => parser });
    const child = createEnvironmentInjector(providers(), TestBed.inject(EnvironmentInjector));

    await expect(child.get(DataParserRegistry).get('json')).resolves.toBe(parser);
  });
});
