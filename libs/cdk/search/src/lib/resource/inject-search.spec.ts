import { Component, Injector, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { DefaultSearchEngine } from '../default-engine/default-engine';
import { injectSearch, InjectSearchOptions } from './inject-search';
import { SearchEngine } from '../engine/search-engine';
import { provideSearch, withCustomEngine } from '../providers';
import { SearchFieldSpec, SearchIndex, SearchResult, SearchSuggestion } from '../engine/types';

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

  createIndex<T>(items: readonly T[], fields?: readonly SearchFieldSpec<T>[]): SearchIndex<T> {
    const index = this.#engine.createIndex(items, fields);
    return {
      search: (query) =>
        new Promise<readonly SearchResult<T>[]>((resolve, reject) => {
          this.pending.push({ resolve: () => resolve(index.search(query)), reject });
        }),
      suggest: (term, limit) => Promise.resolve(index.suggest(term, limit)),
    };
  }
}

function values(suggestions: readonly SearchSuggestion[]): string[] {
  return suggestions.map((suggestion) => suggestion.value);
}

@Component({ selector: 'ang-generic-list', template: '' })
class GenericList<T extends { label: string }> {
  readonly options = input<readonly T[]>([]);
  readonly term = input('');
  readonly search = injectSearch({
    items: this.options,
    term: this.term,
    fields: ['label'],
    suggestionField: 'label',
    order: 'source',
  });
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
    TestBed.configureTestingModule({ providers: [provideSearch({ minLength: 3 })] });
    const term = signal('he');
    const search = setup({ items: ORGANS, term, suggestionField: 'label' });
    expect(search.items()).toEqual(ORGANS);
    expect(search.suggestions()).toEqual([]);

    term.set('hea');
    expect(labels(search.items())).toEqual(['Heart', 'Heartwood']);
  });

  it('applies the result limit and order from the options', () => {
    const limit = signal<number | undefined>(1);
    const order = signal<'rank' | 'source' | undefined>(undefined);
    const items = [{ label: 'Heartwood' }, { label: 'Heart' }];
    const search = setup({ items, term: 'heart', limit, order });
    expect(search.items()).toEqual([items[1]]);

    order.set('source');
    expect(search.items()).toEqual([items[0]]);
    limit.set(undefined);
    expect(search.results()).toEqual([
      expect.objectContaining({ item: items[0] }),
      expect.objectContaining({ item: items[1], matches: [{ field: 'label', value: 'Heart', ranges: [[0, 5]] }] }),
    ]);
  });

  it('suggests values of the suggestion field with their ranges', () => {
    const term = signal('heart');
    const search = setup({ items: ORGANS, term, suggestionField: 'label', suggestionLimit: 1 });
    expect(search.suggestions()).toEqual([{ value: 'Heart', ranges: [[0, 5]] }]);
    expect(setup({ items: ORGANS, term }).suggestions()).toEqual([]);
  });

  it('suggests primitive items without a suggestion field', () => {
    expect(setup({ items: ['Heart', 42, 'Kidney'], term: 'e' }).suggestions()).toEqual([
      { value: 'Heart', ranges: [[1, 2]] },
      { value: 'Kidney', ranges: [[4, 5]] },
    ]);
  });

  it('reads every option reactively', () => {
    const minLength = signal<number | undefined>(3);
    const suggestionLimit = signal<number | undefined>(1);
    const suggestionField = signal<'label' | undefined>('label');
    const engine = signal<SearchEngine | undefined>(undefined);
    const term = signal('he');
    const search = setup({ items: ORGANS, term, minLength, suggestionLimit, suggestionField, engine });
    expect(search.items()).toEqual(ORGANS);

    minLength.set(undefined);
    expect(labels(search.items())).toEqual(['Heart', 'Heartwood']);
    expect(values(search.suggestions())).toEqual(['Heart']);
    suggestionLimit.set(undefined);
    expect(values(search.suggestions())).toEqual(['Heart', 'Heartwood']);
    suggestionField.set(undefined);
    expect(search.suggestions()).toEqual([]);

    engine.set({ createIndex: <T>(items: readonly T[]) => ({ search: () => [{ item: items[0] }] }) });
    expect(search.items()).toEqual([ORGANS[0]]);
  });

  it('type-checks keys inside generic components', async () => {
    const options = [
      { label: 'Heartwood', id: 1 },
      { label: 'Heart', id: 2 },
    ];
    const { fixture } = await render(GenericList<{ label: string; id: number }>, {
      inputs: { options, term: 'heart' },
    });
    const { search } = fixture.componentInstance;
    expect(search.items()).toEqual(options);
    expect(values(search.suggestions())).toEqual(['Heart', 'Heartwood']);
  });

  it('returns no suggestions when the index cannot suggest', () => {
    const engine: SearchEngine = { createIndex: () => ({ search: () => [] }) };
    expect(setup({ items: ORGANS, term: 'heart', suggestionField: 'label', engine }).suggestions()).toEqual([]);
  });

  it('reads the debounce reactively', () => {
    vi.useFakeTimers();
    try {
      const debounce = signal<number | undefined>(undefined);
      const term = signal('');
      const search = setup({ items: ORGANS, term, debounce });

      term.set('heart');
      expect(labels(search.items())).toEqual(['Heart', 'Heartwood']);

      debounce.set(200);
      TestBed.tick();
      term.set('kidney');
      TestBed.tick();
      expect(labels(search.items())).toEqual(['Heart', 'Heartwood']);
      vi.advanceTimersByTime(200);
      expect(labels(search.items())).toEqual(['Left Kidney']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('debounces the term but applies short terms immediately', () => {
    vi.useFakeTimers();
    try {
      TestBed.configureTestingModule({ providers: [provideSearch({ debounce: 300 })] });
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
    expect(values(search.suggestions())).toEqual(['Heart', 'Heartwood']);
    expect(search.loading()).toBe(false);

    term.set('kidney');
    expect(search.loading()).toBe(true);
    expect(labels(search.items())).toEqual(['Heart', 'Heartwood']);
    await settle();
    engine.pending.shift()?.resolve();
    await settle();
    expect(labels(search.items())).toEqual(['Left Kidney']);
  });

  it('drops results for previous items while an asynchronous request is pending', async () => {
    const engine = new DeferredEngine();
    const items = signal(ORGANS);
    const search = setup({ items, term: 'heart', engine });
    await settle();
    engine.pending.shift()?.resolve();
    await settle();
    expect(labels(search.items())).toEqual(['Heart', 'Heartwood']);

    items.set(ORGANS.slice(2));
    expect(search.items()).toEqual([]);
    expect(search.loading()).toBe(true);
    await settle();
    engine.pending.shift()?.resolve();
    await settle();
    expect(labels(search.items())).toEqual(['Heartwood']);
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

    @Component({
      template: '',
      providers: [
        provideSearch(
          {},
          withCustomEngine(() => engine),
        ),
      ],
    })
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
