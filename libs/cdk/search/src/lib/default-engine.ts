import { Service } from '@angular/core';
import { mergeRanges, NormalizedText, normalizeSearchText, normalizeWithOffsets, toOriginalRange } from './normalize';
import {
  SearchEngine,
  SearchField,
  SearchFieldValue,
  SearchIndex,
  SearchMatch,
  SearchQuery,
  SearchRange,
  SearchResult,
} from './types';

/** Score of a match, by tier. Higher tiers rank first. */
export enum SearchMatchTier {
  /** The term appears inside a word. */
  Contains = 1,
  /** The term starts a word other than the first. */
  WordPrefix = 2,
  /** The term starts the value. */
  Prefix = 3,
  /** The term equals the value. */
  Exact = 4,
}

/** Name of the field used when the indexed items are strings or numbers and no fields are given. */
export const DEFAULT_SEARCH_VALUE_FIELD = 'value';

/** Matches a letter or digit. */
const WORD_CHAR = /[\p{L}\p{N}]/u;

/** A normalized value of an indexed field. */
interface IndexedValue extends NormalizedText {
  /** The original value. */
  readonly original: string;
  /** Number of leading whitespace units in the normalized text. */
  readonly lead: number;
  /** Length of the normalized text without surrounding whitespace. */
  readonly trimmedLength: number;
}

/** The normalized values of one field of an item. */
interface IndexedField {
  /** Field name. */
  readonly name: string;
  /** Score multiplier. */
  readonly weight: number;
  /** Normalized values. */
  readonly values: readonly IndexedValue[];
}

/** An indexed item. */
interface IndexedItem<T> {
  /** The original item. */
  readonly item: T;
  /** Normalized fields. */
  readonly fields: readonly IndexedField[];
}

/** The result of matching a term against a value. */
interface ValueMatch {
  /** Best score of the matched words, by word index; 0 when a word does not match. */
  readonly wordScores: number[];
  /** Score of the whole term as a phrase; 0 when it does not appear. */
  readonly phraseScore: number;
  /** Normalized ranges of every word occurrence. */
  readonly ranges: SearchRange[];
}

/** A resolved field definition. */
interface ResolvedField<T> {
  /** Field name. */
  readonly name: string;
  /** Score multiplier. */
  readonly weight: number;
  /**
   * Reads the field values of an item.
   *
   * @param item Item to read.
   * @returns The field values.
   */
  readonly get: (item: T) => unknown;
}

/**
 * The built-in, dependency-free {@link SearchEngine} and the default value of `SEARCH_ENGINE`.
 *
 * Text is decomposed, stripped of diacritics, lowercased, and trimmed. The term is split into words and an item
 * matches when every word appears in at least one field. Results are ranked by {@link SearchMatchTier}: an exact
 * value, then a value prefix, then a word prefix, then any other occurrence. Ties keep the order of the items.
 *
 * Without fields, every string and number value (including arrays of them) of an item is searched, so the matched
 * items are a superset of those matched by a lowercase `includes` check.
 */
@Service()
export class DefaultSearchEngine implements SearchEngine {
  /**
   * Indexes a list of items.
   *
   * @param items Items to index.
   * @param fields Fields to search. Defaults to every string and number value of each item.
   * @returns A synchronous index of the items.
   */
  createIndex<T>(items: readonly T[], fields?: readonly SearchField<T>[]): DefaultSearchIndex<T> {
    return new DefaultSearchIndex(items, fields);
  }
}

/** The synchronous {@link SearchIndex} created by {@link DefaultSearchEngine}. */
export class DefaultSearchIndex<T> implements SearchIndex<T> {
  /** Indexed items in their original order. */
  readonly #items: readonly IndexedItem<T>[];

  /**
   * @param items Items to index.
   * @param fields Fields to search; defaults to every string and number value of each item.
   */
  constructor(items: readonly T[], fields?: readonly SearchField<T>[]) {
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
   * @returns Matching results ordered by relevance.
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
            const ranges = mergeRanges(match.ranges.map(([start, end]) => toOriginalRange(value, start, end)));
            matches.push({ field: field.name, value: value.original, ranges });
          }
        }
      }

      if (wordScores.every((score) => score > 0)) {
        results.push({ item, score: combineScores(wordScores, phraseScore), matches, index });
      }
    });

    return results
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, query.limit)
      .map(({ item, score, matches }) => ({ item, score, matches }));
  }

  /**
   * Suggests unique field values that contain every word of a term.
   *
   * @param term Search term.
   * @param limit Maximum number of suggestions.
   * @returns Suggested values ordered by relevance, then by first appearance.
   */
  suggest(term: string, limit?: number): string[] {
    const normalized = normalizeSearchText(term);
    if (normalized === '') {
      return [];
    }

    const words = normalized.split(/\s+/);
    const scores = new Map<string, number>();
    for (const { fields } of this.#items) {
      for (const field of fields) {
        for (const value of field.values) {
          const match = matchValue(value, normalized, words, field.weight);
          if (match.wordScores.every((score) => score > 0)) {
            const score = combineScores(match.wordScores, match.phraseScore);
            scores.set(value.original, Math.max(scores.get(value.original) ?? 0, score));
          }
        }
      }
    }

    // Map iteration keeps insertion order and the sort is stable, so ties keep their first appearance
    return [...scores]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([value]) => value);
  }
}

/**
 * Resolves a field into a definition.
 *
 * @param field A key or field definition.
 * @returns The resolved field.
 */
function resolveField<T>(field: SearchField<T>): ResolvedField<T> {
  if (typeof field === 'string') {
    return { name: field, weight: 1, get: (item) => (item as Record<string, unknown>)[field] };
  }
  return { name: field.name, weight: field.weight ?? 1, get: (item) => field.get(item) };
}

/**
 * Derives the default fields of an item: the item itself when it is a string or number, otherwise each of its own
 * enumerable properties.
 *
 * @param item Item to derive fields for.
 * @returns The item's default fields.
 */
function defaultFields<T>(item: T): ResolvedField<T>[] {
  if (isPrimitive(item)) {
    return [{ name: DEFAULT_SEARCH_VALUE_FIELD, weight: 1, get: (value) => value }];
  }
  if (typeof item !== 'object' || item === null) {
    return [];
  }
  return Object.keys(item).map((key) => ({
    name: key,
    weight: 1,
    get: (value) => (value as Record<string, unknown>)[key],
  }));
}

/**
 * Reads and normalizes a field of an item.
 *
 * @param field Field to read.
 * @param item Item to read.
 * @returns The indexed field.
 */
function indexField<T>(field: ResolvedField<T>, item: T): IndexedField {
  const values = toStrings(field.get(item) as SearchFieldValue).map((original) => {
    const normalized = normalizeWithOffsets(original);
    const lead = normalized.text.length - normalized.text.trimStart().length;
    return { ...normalized, original, lead, trimmedLength: normalized.text.trim().length };
  });
  return { name: field.name, weight: field.weight, values };
}

/**
 * Converts a field value into the strings to search. Values other than strings, numbers, and arrays of them are
 * ignored.
 *
 * @param value Field value.
 * @returns Searchable strings.
 */
function toStrings(value: unknown): string[] {
  const values: unknown[] = Array.isArray(value) ? value : [value];
  return values.filter(isPrimitive).map(String);
}

/**
 * Checks whether a value is searchable on its own.
 *
 * @param value Value to check.
 * @returns True for strings and numbers.
 */
function isPrimitive(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}

/**
 * Matches the words of a term against a value.
 *
 * @param value Indexed value.
 * @param term Normalized term.
 * @param words Words of the term.
 * @param weight Field weight.
 * @returns Per-word scores, the phrase score, and the normalized ranges of every occurrence.
 */
function matchValue(value: IndexedValue, term: string, words: readonly string[], weight: number): ValueMatch {
  const ranges: SearchRange[] = [];
  const wordScores = words.map((word) => {
    let best = 0;
    for (const index of occurrences(value.text, word)) {
      best = Math.max(best, tierAt(value, index, word.length));
      ranges.push([index, index + word.length]);
    }
    return best * weight;
  });

  let phraseScore = 0;
  if (words.length > 1) {
    for (const index of occurrences(value.text, term)) {
      phraseScore = Math.max(phraseScore, tierAt(value, index, term.length) * weight);
    }
  }

  return { wordScores, phraseScore, ranges };
}

/**
 * Finds the non-overlapping occurrences of a needle.
 *
 * @param haystack Text to search.
 * @param needle Non-empty text to find.
 * @returns Start offsets of each occurrence.
 */
function occurrences(haystack: string, needle: string): number[] {
  const indices: number[] = [];
  for (let index = haystack.indexOf(needle); index !== -1; index = haystack.indexOf(needle, index + needle.length)) {
    indices.push(index);
  }
  return indices;
}

/**
 * Classifies an occurrence of a term within a value.
 *
 * @param value Indexed value.
 * @param index Normalized start offset of the occurrence.
 * @param length Normalized length of the occurrence.
 * @returns The match tier.
 */
function tierAt(value: IndexedValue, index: number, length: number): SearchMatchTier {
  if (index === value.lead) {
    return length === value.trimmedLength ? SearchMatchTier.Exact : SearchMatchTier.Prefix;
  }
  return WORD_CHAR.test(value.text[index - 1]) ? SearchMatchTier.Contains : SearchMatchTier.WordPrefix;
}

/**
 * Combines word and phrase scores into an item score. An item scores at least the mean of its words' best scores,
 * or the score of the whole term as a phrase when that is higher.
 *
 * @param wordScores Best score of each word.
 * @param phraseScore Best score of the whole term.
 * @returns The combined score.
 */
function combineScores(wordScores: readonly number[], phraseScore: number): number {
  const mean = wordScores.reduce((sum, score) => sum + score, 0) / wordScores.length;
  return Math.max(mean, phraseScore);
}
