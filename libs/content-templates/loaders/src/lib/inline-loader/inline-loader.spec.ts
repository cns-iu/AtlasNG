import { inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DATA_LOADERS, DataLoaderRegistry, DataLoaderContext } from '../data-loader-registry';
import { InlineDataLoader, InlineDataLoaderConfig } from './inline-loader';

const context: DataLoaderContext = {
  node: { component: 'test' },
  path: 'content',
  key: 'rows',
  signal: new AbortController().signal,
};

describe('InlineDataLoader', () => {
  it('can be registered', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DATA_LOADERS, useValue: { inline: () => inject(InlineDataLoader) }, multi: true },
        DataLoaderRegistry,
      ],
    });

    await expect(TestBed.inject(DataLoaderRegistry).get('inline')).resolves.toBeInstanceOf(InlineDataLoader);
  });

  it('returns the configured value as is', () => {
    const value = { rows: [{ id: 1 }] };

    expect(new InlineDataLoader().load({ value }, context)).toBe(value);
  });

  it('returns primitive values', () => {
    expect(new InlineDataLoader().load({ value: null }, context)).toBeNull();
  });

  it('rejects sources without a value', () => {
    expect(() => new InlineDataLoader().load({} as InlineDataLoaderConfig, context)).toThrow(
      "Invalid content at 'content': data.rows.value: Expected a `value`.",
    );
  });
});
