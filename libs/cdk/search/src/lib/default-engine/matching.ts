import { SearchRange } from '../engine/types';
import { IndexedValue } from './fields';

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

/** Matches a letter or digit. */
const WORD_CHAR = /[\p{L}\p{N}]/u;

/** The result of matching a term against a value. */
export interface ValueMatch {
  /** Best score of the matched words, by word index; 0 when a word does not match. */
  readonly wordScores: number[];
  /** Score of the whole term as a phrase; 0 when it does not appear. */
  readonly phraseScore: number;
  /** Normalized ranges of every word occurrence. */
  readonly ranges: SearchRange[];
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
export function matchValue(value: IndexedValue, term: string, words: readonly string[], weight: number): ValueMatch {
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
export function combineScores(wordScores: readonly number[], phraseScore: number): number {
  const mean = wordScores.reduce((sum, score) => sum + score, 0) / wordScores.length;
  return Math.max(mean, phraseScore);
}
