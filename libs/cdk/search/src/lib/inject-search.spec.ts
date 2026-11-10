import { Component, Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { DefaultSearchEngine } from './default-engine';
import { injectSearch, InjectSearchOptions } from './inject-search';
import { provideSearch, withCustomEngine, withSearchConfig } from './providers';
import { SearchEngine, SearchIndex, SearchResult } from './types';

interface Organ {
  label: string;
  description: string;
}

const ORGANS: Organ[] = [
  { label: 'Left Kidney', description: 'Filters blood' },
  { label: 'Heart', description: 'Pumps blood' },
  { label: 'Heartwood', description: 'Not an organ' },
];

function setup<T>(options: InjectSearchOptions<T>) {
  return TestBed.runInInjectionContext(() => injectSearch(options));
}

function labels(items: readonly Organ[]): string[] {
  return items.map((item) => item.label);
}

class DeferredEngine implements SearchEngine {
  readonly #engine = new DefaultSearchEngine();
  readonly pending: { resolve: () => void; reject: (error: unknown) => void }[] = [];

  createIndex<T>(items: readonly T[]): SearchIndex<T> {
    const index = this.#engine.createIndex(items);
    return {
      search: (query) =>
        new Promise<readonly SearchResult<T>[]>((resolve, reject) => {
          this.pending.push({ resolve: () => resolve(index.search(query)), reject });
        }),
      suggest: (term, limit) => Promise.resolve(index.suggest?.(term, limit) ?? []),
    };
  }
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  TestBed.tick();
}

describe('injectSearch', () => {
  it('returns every item for an empty term and ranked matches otherwise', () => {
    const term = signal('');
    const search = setup({ items: ORGANS, term });
    expect(search.results()).toEqual(ORGANS.map((item) => ({ item })));
    expect(search.suggestions()).toEqual([]);
    expect(search.loading()).toBe(false);

    term.set('heart');
    expect(labels(search.items())).toEqual(['Heart', 'Heartwood']);
    expect(search.results()[0].matches).toEqual([{ field: 'label', value: 'Heart', ranges: [[0, 5]] }]);
  });

  it('rebuilds the index only when the items or fields change', () => {
    const engine = new DefaultSearchEngine();
    const createIndex = vi.spyOn(engine, 'createIndex');
    const items = signal(ORGANS);
    const fields = signal<(keyof Organ)[]>(['label']);
    const term = signal('blood');
    const search = setup({ items, term, fields, engine });

    expect(search.items()).toEqual([]);
    term.set('heart');
    expect(labels(search.items())).toEqual(['Heart', 'Heartwood']);
    expect(createIndex).toHaveBeenCalledTimes(1);

    fields.set(['description']);
    term.set('blood');
    expect(labels(search.items())).toEqual(['Left Kidney', 'Heart']);
    items.set(ORGANS.slice(1));
    expect(labels(search.items())).toEqual(['Heart']);
    expect(createIndex).toHaveBeenCalledTimes(3);
  });

  it('returns every item for terms shorter than the minimum length', () => {
    TestBed.configureTestingModule({ providers: [provideSearch(withSearchConfig({ minLength: 3 }))] });
    const term = signal('he');
    const search = setup({ items: ORGANS, term, suggestionField: 'label' });
    expect(search.items()).toEqual(ORGANS);
    expect(search.suggestions()).toEqual([]);

    term.set('hea');
    expect(labels(search.items())).toEqual(['Heart', 'Heartwood']);
  });

  it('applies the result limit from the options or configuration', () => {
    TestBed.configureTestingModule({ providers: [provideSearch(withSearchConfig({ limit: 1 }))] });
    expect(setup({ items: ORGANS, term: 'blood' }).items()).toHaveLength(1);
    expect(setup({ items: ORGANS, term: 'blood', limit: 5 }).items()).toHaveLength(2);
  });

  it('suggests values of the suggestion field', () => {
    const term = signal('heart');
    const search = setup({ items: ORGANS, term, suggestionField: 'label', suggestionLimit: 1 });
    expect(search.suggestions()).toEqual(['Heart']);
    expect(setup({ items: ORGANS, term }).suggestions()).toEqual([]);
  });

  it('returns no suggestions when the index cannot suggest', () => {
    const engine: SearchEngine = { createIndex: () => ({ search: () => [] }) };
    expect(setup({ items: ORGANS, term: 'heart', suggestionField: 'label', engine }).suggestions()).toEqual([]);
  });

  it('debounces the term but applies short terms immediately', () => {
    vi.useFakeTimers();
    try {
      TestBed.configureTestingModule({ providers: [provideSearch(withSearchConfig({ debounce: 300 }))] });
      const term = signal('');
      const search = setup({ items: ORGANS, term });

      term.set('heart');
      TestBed.tick();
      expect(search.items()).toEqual(ORGANS);
      vi.advanceTimersByTime(300);
      expect(labels(search.items())).toEqual(['Heart', 'Heartwood']);

      term.set('kidney');
      TestBed.tick();
      vi.advanceTimersByTime(100);
      term.set('');
      TestBed.tick();
      expect(search.items()).toEqual(ORGANS);
      vi.advanceTimersByTime(300);
      expect(search.items()).toEqual(ORGANS);
    } finally {
      vi.useRealTimers();
    }
  });

  it('resolves asynchronous engines and keeps previous results while loading', async () => {
    const engine = new DeferredEngine();
    const term = signal('heart');
    const search = setup({ items: ORGANS, term, engine, suggestionField: 'label' });

    expect(search.items()).toEqual([]);
    expect(search.loading()).toBe(true);
    await settle();
    engine.pending.shift()?.resolve();
    await settle();
    expect(labels(search.items())).toEqual(['Heart', 'Heartwood']);
    expect(search.suggestions()).toEqual(['Heart', 'Heartwood']);
    expect(search.loading()).toBe(false);

    term.set('kidney');
    expect(search.loading()).toBe(true);
    expect(labels(search.items())).toEqual(['Heart', 'Heartwood']);
    await settle();
    engine.pending.shift()?.resolve();
    await settle();
    expect(labels(search.items())).toEqual(['Left Kidney']);
  });

  it('exposes errors of asynchronous engines', async () => {
    const engine = new DeferredEngine();
    const search = setup({ items: ORGANS, term: 'heart', engine });
    await settle();
    engine.pending.shift()?.reject(new Error('offline'));
    await settle();
    expect(search.items()).toEqual([]);
    expect(search.error()).toEqual(new Error('offline'));
    expect(search.loading()).toBe(false);
  });

  it('uses the engine provided by a component', async () => {
    const engine: SearchEngine = { createIndex: <T>(items: readonly T[]) => ({ search: () => [{ item: items[1] }] }) };

    @Component({ template: '', providers: [provideSearch(withCustomEngine(() => engine))] })
    class Host {
      readonly search = injectSearch({ items: ORGANS, term: 'x' });
    }

    const { fixture } = await render(Host);
    expect(fixture.componentInstance.search.items()).toEqual([ORGANS[1]]);
  });

  it('accepts an injector outside an injection context', () => {
    const injector = TestBed.inject(Injector);
    expect(injectSearch({ items: ORGANS, term: 'heart', injector }).items()).toHaveLength(2);
    expect(() => injectSearch({ items: ORGANS, term: 'heart' })).toThrow();
  });
});
