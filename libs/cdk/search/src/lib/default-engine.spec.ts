import { TestBed } from '@angular/core/testing';
import { DEFAULT_SEARCH_VALUE_FIELD, DefaultSearchEngine, SearchMatchTier } from './default-engine';
import { SearchResult } from './types';

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
        { field: 'description', value: 'Pumps blood', ranges: [[8, 10]] },
        { field: 'description', value: 'Muscular organ', ranges: [[9, 10]] },
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

    it('limits results after ranking', () => {
      const results = engine.createIndex(ORGANS, ['label']).search({ term: 'heart', limit: 1 });
      expect(labels(results)).toEqual(['Heart']);
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
      expect(duplicates.suggest('heart')).toEqual(['Heart', 'Heartwood', 'Café Heart']);
    });

    it('requires every word to appear in the suggested value', () => {
      expect(index.suggest('kid left')).toEqual(['Left Kidney']);
    });

    it('limits suggestions', () => {
      expect(index.suggest('e', 2)).toHaveLength(2);
    });
  });
});
