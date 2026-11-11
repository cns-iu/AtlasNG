import { SearchRange } from '../engine/types';
import { normalizeSearchText, normalizeWithOffsets, toOriginalRange } from './normalize';
import { mergeRanges } from './ranges';

/**
 * Finds every occurrence of the words of a term in a text, ignoring case and accents like the default engine.
 * Unlike a search, a word is matched even when other words of the term do not appear in the text.
 *
 * @param text Text to search.
 * @param term Search term. Split into words on whitespace.
 * @returns Sorted, non-overlapping ranges of the text, e.g. for `SearchHighlight`. Empty for an empty term.
 */
export function findMatchRanges(text: string, term: string): SearchRange[] {
  const words = normalizeSearchText(term).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }

  const normalized = normalizeWithOffsets(text);
  return mergeRanges(
    words.flatMap((word) =>
      occurrences(normalized.text, word).map((index) => toOriginalRange(normalized, index, index + word.length)),
    ),
  );
}

/**
 * Finds the non-overlapping occurrences of a needle.
 *
 * @param haystack Text to search.
 * @param needle Non-empty text to find.
 * @returns Start offsets of each occurrence.
 */
export function occurrences(haystack: string, needle: string): number[] {
  const indices: number[] = [];
  for (let index = haystack.indexOf(needle); index !== -1; index = haystack.indexOf(needle, index + needle.length)) {
    indices.push(index);
  }
  return indices;
}
