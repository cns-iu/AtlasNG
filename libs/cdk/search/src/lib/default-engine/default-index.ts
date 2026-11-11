import {
  SearchFieldSpec,
  SearchIndex,
  SearchMatch,
  SearchQuery,
  SearchResult,
  SearchSuggestion,
} from '../engine/types';
import { normalizeSearchText } from '../text/normalize';
import { defaultFields, IndexedItem, indexField, resolveField, toOriginalRanges } from './fields';
import { combineScores, matchValue } from './matching';

/** The synchronous {@link SearchIndex} created by {@link DefaultSearchEngine}. */
export class DefaultSearchIndex<T> implements SearchIndex<T> {
  /** Indexed items in their original order. */
  readonly #items: readonly IndexedItem<T>[];

  /**
   * @param items Items to index.
   * @param fields Fields to search; defaults to every string and number value of each item.
   */
  constructor(items: readonly T[], fields?: readonly SearchFieldSpec<T>[]) {
    const resolved = fields?.map(resolveField);
    this.#items = items.map((item) => ({
      item,
      fields: (resolved ?? defaultFields(item)).map((field) => indexField(field, item)),
    }));
  }

  /**
   * Searches the indexed items.
   *
   * @param query Search request.
   * @returns Matching results ordered by relevance, or in item order when `query.order` is `'source'`.
   */
  search(query: SearchQuery<T>): SearchResult<T>[] {
    const term = normalizeSearchText(query.term);
    if (term === '') {
      return this.#items.slice(0, query.limit).map(({ item }) => ({ item }));
    }

    const words = term.split(/\s+/);
    const allowed = query.fields && new Set<string>(query.fields);
    const results: (SearchResult<T> & { score: number; index: number })[] = [];

    this.#items.forEach(({ item, fields }, index) => {
      const wordScores = words.map(() => 0);
      let phraseScore = 0;
      const matches: SearchMatch[] = [];

      for (const field of fields) {
        if (allowed && !allowed.has(field.name)) {
          continue;
        }
        for (const value of field.values) {
          const match = matchValue(value, term, words, field.weight);
          match.wordScores.forEach((score, i) => (wordScores[i] = Math.max(wordScores[i], score)));
          phraseScore = Math.max(phraseScore, match.phraseScore);
          if (match.ranges.length > 0) {
            const ranges = toOriginalRanges(value, match.ranges);
            matches.push({
              field: field.name,
              value: value.original,
              ranges,
              ...(value.index === undefined ? {} : { index: value.index }),
            });
          }
        }
      }

      if (wordScores.every((score) => score > 0)) {
        results.push({ item, score: combineScores(wordScores, phraseScore), matches, index });
      }
    });

    if (query.order !== 'source') {
      results.sort((a, b) => b.score - a.score || a.index - b.index);
    }
    return results.slice(0, query.limit).map(({ item, score, matches }) => ({ item, score, matches }));
  }

  /**
   * Suggests unique field values that contain every word of a term.
   *
   * @param term Search term.
   * @param limit Maximum number of suggestions.
   * @returns Suggested values with their match ranges, ordered by relevance, then by first appearance.
   */
  suggest(term: string, limit?: number): SearchSuggestion[] {
    const normalized = normalizeSearchText(term);
    if (normalized === '') {
      return [];
    }

    const words = normalized.split(/\s+/);
    const suggestions = new Map<string, SearchSuggestion & { score: number }>();
    for (const { fields } of this.#items) {
      for (const field of fields) {
        for (const value of field.values) {
          const match = matchValue(value, normalized, words, field.weight);
          if (match.wordScores.every((score) => score > 0)) {
            const score = combineScores(match.wordScores, match.phraseScore);
            const previous = suggestions.get(value.original);
            if (!previous || score > previous.score) {
              // Equal values have equal ranges, so only the score can change
              const ranges = previous?.ranges ?? toOriginalRanges(value, match.ranges);
              suggestions.set(value.original, { value: value.original, ranges, score });
            }
          }
        }
      }
    }

    // Map iteration keeps insertion order and the sort is stable, so ties keep their first appearance
    return [...suggestions.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ value, ranges }) => ({ value, ranges }));
  }
}
