import { TestBed } from '@angular/core/testing';
import { SearchResult } from '../engine/types';
import { DEFAULT_SEARCH_VALUE_FIELD } from '../engine/values';
import { DefaultSearchEngine } from './default-engine';
import { SearchMatchTier } from './matching';

interface Organ {
  label: string;
  description?: string | string[];
  synonyms?: string[];
  count?: number;
  active?: boolean;
}

const ORGANS: Organ[] = [
  { label: 'Left Kidney', description: 'Paired organ', synonyms: ['ren'] },
  { label: 'Heart', description: ['Pumps blood', 'Muscular organ'], count: 4 },
  { label: 'Kidney', description: 'Filters blood' },
  { label: 'Heartwood', active: true },
  { label: 'Café Heart' },
];

function labels(results: readonly SearchResult<Organ>[]): string[] {
  return results.map((result) => result.item.label);
}

function includesTerm(organ: Organ, term: string): boolean {
  const values: unknown[] = Object.values(organ).flat();
  return values.some(
    (value) => (typeof value === 'string' || typeof value === 'number') && String(value).toLowerCase().includes(term),
  );
}

describe('DefaultSearchEngine', () => {
  const engine = new DefaultSearchEngine();

  it('is injectable', () => {
    expect(TestBed.inject(DefaultSearchEngine)).toBeInstanceOf(DefaultSearchEngine);
  });

  describe('search', () => {
    it('returns every item without scores for an empty term', () => {
      const results = engine.createIndex(ORGANS).search({ term: '   ', limit: 2 });
      expect(results).toEqual([{ item: ORGANS[0] }, { item: ORGANS[1] }]);
    });

    it('matches a superset of a lowercase includes check across all values', () => {
      const index = engine.createIndex(ORGANS);
      for (const term of ['heart', 'blood', 'organ', 'ren', '4', 'ey', 'caf']) {
        const expected = ORGANS.filter((organ) => includesTerm(organ, term));
        const actual = index.search({ term }).map((result) => result.item);
        expect(new Set(actual)).toEqual(new Set(expected));
      }
    });

    it('ignores booleans and other non-searchable values', () => {
      expect(engine.createIndex(ORGANS).search({ term: 'true' })).toEqual([]);
    });

    it('ranks exact, prefix, word prefix, then contains matches', () => {
      const items = [{ label: 'xheartx' }, { label: 'my heart' }, { label: 'heartbeat' }, { label: 'Heart' }];
      const results = engine.createIndex(items, ['label']).search({ term: 'heart' });
      expect(results.map((result) => result.item.label)).toEqual(['Heart', 'heartbeat', 'my heart', 'xheartx']);
      expect(results.map((result) => result.score)).toEqual([
        SearchMatchTier.Exact,
        SearchMatchTier.Prefix,
        SearchMatchTier.WordPrefix,
        SearchMatchTier.Contains,
      ]);
    });

    it('keeps source order for ties', () => {
      const results = engine.createIndex(ORGANS, ['description']).search({ term: 'blood' });
      expect(labels(results)).toEqual(['Heart', 'Kidney']);
    });

    it('ignores accents and case', () => {
      const index = engine.createIndex(ORGANS, ['label']);
      expect(labels(index.search({ term: 'CAFE' }))).toEqual(['Café Heart']);
      expect(labels(index.search({ term: 'café' }))).toEqual(['Café Heart']);
    });

    it('requires every word to match some field', () => {
      const index = engine.createIndex(ORGANS);
      expect(labels(index.search({ term: 'kidney paired' }))).toEqual(['Left Kidney']);
      expect(labels(index.search({ term: 'kidney muscular' }))).toEqual([]);
    });

    it('ranks a matching phrase above separate words', () => {
      const items = [{ label: 'heart left' }, { label: 'left heart' }];
      expect(engine.createIndex(items, ['label']).search({ term: 'left heart' })[0].item.label).toBe('left heart');
    });

    it('reports match ranges of the original values', () => {
      const [result] = engine.createIndex(ORGANS, ['label']).search({ term: 'cafe hea' });
      expect(result.matches).toEqual([
        {
          field: 'label',
          value: 'Café Heart',
          ranges: [
            [0, 4],
            [5, 8],
          ],
        },
      ]);
    });

    it('reports one match per matching array value', () => {
      const [result] = engine.createIndex(ORGANS, ['description']).search({ term: 'organ' });
      expect(result.matches).toEqual([{ field: 'description', value: 'Paired organ', ranges: [[7, 12]] }]);
      const heart = engine.createIndex([ORGANS[1]], ['description']).search({ term: 'o' });
      expect(heart[0].matches).toEqual([
        { field: 'description', value: 'Pumps blood', ranges: [[8, 10]], index: 0 },
        { field: 'description', value: 'Muscular organ', ranges: [[9, 10]], index: 1 },
      ]);
    });

    it('supports computed fields with weights', () => {
      const index = engine.createIndex(ORGANS, [
        'label',
        { name: 'all', get: (organ) => [organ.description].flat(), weight: 10 },
      ]);
      const results = index.search({ term: 'organ' });
      expect(labels(results)).toEqual(['Left Kidney', 'Heart']);
      expect(results[0].score).toBe(SearchMatchTier.WordPrefix * 10);
    });

    it('restricts the search to the query fields', () => {
      const index = engine.createIndex(ORGANS, ['label', 'description']);
      expect(labels(index.search({ term: 'kidney blood', fields: ['label'] }))).toEqual([]);
      expect(labels(index.search({ term: 'heart', fields: ['label'] }))).toEqual(['Heart', 'Heartwood', 'Café Heart']);
    });

    it('reports the position of matches in array values', () => {
      const [result] = engine.createIndex([{ tags: [null, 'heart', 'heart'] }], ['tags']).search({ term: 'heart' });
      expect(result.matches?.map((match) => match.index)).toEqual([1, 2]);
    });

    it('returns matches in item order for source order', () => {
      const items = [{ label: 'xheartx' }, { label: 'Heart' }, { label: 'heartbeat' }];
      const results = engine.createIndex(items, ['label']).search({ term: 'heart', order: 'source', limit: 2 });
      expect(results.map((result) => result.item.label)).toEqual(['xheartx', 'Heart']);
      expect(results[1]).toEqual({
        item: items[1],
        score: SearchMatchTier.Exact,
        matches: [{ field: 'label', value: 'Heart', ranges: [[0, 5]] }],
      });
    });

    it('ignores keys of items that are not objects', () => {
      const items: unknown[] = [null, 'label', { label: 'Label' }];
      const results = engine.createIndex(items, ['label' as never]).search({ term: 'label' });
      expect(results.map((result) => result.item)).toEqual([items[2]]);
    });

    it('limits results after ranking', () => {
      const results = engine.createIndex(ORGANS, ['label']).search({ term: 'heart', limit: 1 });
      expect(labels(results)).toEqual(['Heart']);
    });

    it('matches only items that pass the filter', () => {
      const index = engine.createIndex(ORGANS, ['label']);
      const filter = vi.fn((organ: Organ) => organ.label !== 'Heart');
      expect(labels(index.search({ term: 'heart', filter }))).toEqual(['Heartwood', 'Café Heart']);
      expect(filter).toHaveBeenCalledTimes(ORGANS.length);
    });

    it('limits results after filtering', () => {
      const index = engine.createIndex(ORGANS, ['label']);
      const filter = (organ: Organ) => organ.label !== 'Heart';
      expect(labels(index.search({ term: 'heart', filter, limit: 1 }))).toEqual(['Heartwood']);
      expect(labels(index.search({ term: 'heart', filter, limit: 1, order: 'source' }))).toEqual(['Heartwood']);
    });

    it('filters before limiting for an empty term', () => {
      const filter = (organ: Organ) => organ.label.includes('Kidney');
      const results = engine.createIndex(ORGANS).search({ term: '', filter, limit: 2 });
      expect(results).toEqual([{ item: ORGANS[0] }, { item: ORGANS[2] }]);
    });

    it('searches primitive items', () => {
      const results = engine.createIndex(['Alpha', 42, 'Beta']).search({ term: '4' });
      expect(results).toEqual([
        {
          item: 42,
          score: SearchMatchTier.Prefix,
          matches: [{ field: DEFAULT_SEARCH_VALUE_FIELD, value: '42', ranges: [[0, 1]] }],
        },
      ]);
    });

    it('skips items without searchable values', () => {
      expect(engine.createIndex<unknown>([null, true, undefined]).search({ term: 'x' })).toEqual([]);
    });

    it('treats surrounding whitespace as part of an exact match', () => {
      const [result] = engine.createIndex(['  Heart  ']).search({ term: 'heart' });
      expect(result.score).toBe(SearchMatchTier.Exact);
      expect(result.matches?.[0].ranges).toEqual([[2, 7]]);
    });
  });

  describe('suggest', () => {
    const index = engine.createIndex(ORGANS, ['label']);

    it('returns no suggestions for an empty term', () => {
      expect(index.suggest('')).toEqual([]);
    });

    it('returns unique matching values ordered by relevance', () => {
      const duplicates = engine.createIndex([...ORGANS, { label: 'Heart' }], ['label']);
      expect(duplicates.suggest('heart').map((suggestion) => suggestion.value)).toEqual([
        'Heart',
        'Heartwood',
        'Café Heart',
      ]);
    });

    it('requires every word to appear in the suggested value', () => {
      expect(index.suggest('kid left')).toEqual([
        {
          value: 'Left Kidney',
          ranges: [
            [0, 4],
            [5, 8],
          ],
        },
      ]);
    });

    it('reports the match ranges of the original values', () => {
      expect(index.suggest('cafe')).toEqual([{ value: 'Café Heart', ranges: [[0, 4]] }]);
    });

    it('keeps the best score of repeated values', () => {
      const items = [{ label: 'my heart' }, { label: 'Heartwood' }, { label: 'my heart', boost: true }];
      const repeated = engine.createIndex(items, [
        'label',
        { name: 'boosted', get: (item) => (item.boost ? item.label : null), weight: 10 },
      ]);
      expect(repeated.suggest('heart')).toEqual([
        { value: 'my heart', ranges: [[3, 8]] },
        { value: 'Heartwood', ranges: [[0, 5]] },
      ]);
    });

    it('limits suggestions', () => {
      expect(index.suggest('e', 2)).toHaveLength(2);
    });

    it('suggests only values of items that pass the filter', () => {
      const filter = (organ: Organ) => organ.label !== 'Heart';
      expect(index.suggest('heart', 1, filter)).toEqual([{ value: 'Heartwood', ranges: [[0, 5]] }]);
      expect(index.suggest('heart', undefined, () => false)).toEqual([]);
    });

    it('suggests a repeated value when any of its items passes the filter', () => {
      const items = [
        { label: 'Heart', id: 1 },
        { label: 'Heart', id: 2 },
      ];
      const repeated = engine.createIndex(items, ['label']);
      expect(repeated.suggest('heart', undefined, (item) => item.id === 2)).toEqual([
        { value: 'Heart', ranges: [[0, 5]] },
      ]);
    });
  });
});
