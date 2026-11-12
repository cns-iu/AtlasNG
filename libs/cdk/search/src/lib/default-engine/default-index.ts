import {
  SearchFieldSpec,
  SearchFilter,
  SearchIndex,
  SearchMatch,
  SearchQuery,
  SearchResult,
  SearchSuggestion,
} from '../engine/types';
import { normalizeSearchText } from '../text/normalize';
import {
  defaultFields,
  IndexedField,
  IndexedItem,
  IndexedValue,
  indexField,
  resolveField,
  toOriginalRanges,
} from './fields';
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
      const { filter } = query;
      const items = filter ? this.#items.filter(({ item }) => filter(item)) : this.#items;
      return items.slice(0, query.limit).map(({ item }) => ({ item }));
    }

    const words = term.split(/\s+/);
    const allowed = query.fields && new Set<string>(query.fields);
    const results: RankedResult<T>[] = [];

    let state: SearchMatchState<T> | undefined;
    for (const [value, field, item, index] of this.#iterateFieldValues(allowed, query.filter)) {
      if (state?.index !== index) {
        state?.addResultTo(results);
        state = new SearchMatchState(term, words, item, index);
      }

      state.add(value, field);
    }
    state?.addResultTo(results);

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
   * @param filter Only values of items for which this returns true are suggested.
   * @returns Suggested values with their match ranges, ordered by relevance, then by first appearance.
   */
  suggest(term: string, limit?: number, filter?: SearchFilter<T>): SearchSuggestion[] {
    const normalized = normalizeSearchText(term);
    if (normalized === '') {
      return [];
    }

    const words = normalized.split(/\s+/);
    const suggestions = new Map<string, SearchSuggestion & { score: number }>();
    for (const [value, field] of this.#iterateFieldValues(undefined, filter)) {
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

    // Map iteration keeps insertion order and the sort is stable, so ties keep their first appearance
    return [...suggestions.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ value, ranges }) => ({ value, ranges }));
  }

  /**
   * Iterates over the values of every indexed field, item by item in their original order.
   *
   * @param allowed Names of the fields to include. Defaults to every field.
   * @param filter Items to include, tested once per item. Defaults to every item.
   * @yields Each value with its field, item, and the item's position in the index.
   */
  *#iterateFieldValues(
    allowed?: Set<string>,
    filter?: SearchFilter<T>,
  ): Generator<[value: IndexedValue, field: IndexedField, item: T, index: number]> {
    let index = 0;
    for (const { fields, item } of this.#items) {
      if (filter && !filter(item)) {
        index++;
        continue;
      }

      for (const field of fields) {
        if (allowed && !allowed.has(field.name)) {
          continue;
        }

        for (const value of field.values) {
          yield [value, field, item, index];
        }
      }

      index++;
    }
  }
}

/** A search result with the data used to order it. */
type RankedResult<T> = SearchResult<T> & { readonly score: number; readonly index: number };

/** Accumulates the matches of a search term across the field values of one item. */
class SearchMatchState<T> {
  /** Best score of each word of the term across the values added so far. */
  readonly #wordScores: number[];

  /** Best score of the whole term as a phrase across the values added so far. */
  #phraseScore = 0;

  /** Values that matched at least one word, with their ranges. */
  readonly #matches: SearchMatch[] = [];

  /**
   * @param term Normalized search term.
   * @param words Words of the term.
   * @param item The item whose values are matched.
   * @param index Position of the item in the index.
   */
  constructor(
    readonly term: string,
    readonly words: readonly string[],
    readonly item: T,
    readonly index: number,
  ) {
    this.#wordScores = words.map(() => 0);
  }

  /**
   * Matches the term against a value of the item and records the scores and ranges.
   *
   * @param value Indexed value.
   * @param field Field of the value.
   */
  add(value: IndexedValue, field: IndexedField): void {
    const match = matchValue(value, this.term, this.words, field.weight);
    match.wordScores.forEach((score, i) => (this.#wordScores[i] = Math.max(this.#wordScores[i], score)));
    this.#phraseScore = Math.max(this.#phraseScore, match.phraseScore);
    if (match.ranges.length > 0) {
      this.#matches.push({
        field: field.name,
        value: value.original,
        ranges: toOriginalRanges(value, match.ranges),
        ...(value.index === undefined ? {} : { index: value.index }),
      });
    }
  }

  /**
   * Adds the item to the results when every word of the term matched one of its values.
   *
   * @param results Results to add to.
   */
  addResultTo(results: RankedResult<T>[]): void {
    if (this.#wordScores.every((score) => score > 0)) {
      results.push({
        item: this.item,
        score: combineScores(this.#wordScores, this.#phraseScore),
        matches: this.#matches,
        index: this.index,
      });
    }
  }
}
