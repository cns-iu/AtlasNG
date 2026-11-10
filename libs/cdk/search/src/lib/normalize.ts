import { SearchRange } from './types';

/** Matches combining marks left over after canonical decomposition. */
const COMBINING_MARKS = /\p{M}/gu;

/** A normalized string with offsets back into the original string. */
export interface NormalizedText {
  /** Normalized text. */
  readonly text: string;
  /** Original start offset of each normalized UTF-16 unit. */
  readonly starts: readonly number[];
  /** Original end offset (exclusive) of each normalized UTF-16 unit. */
  readonly ends: readonly number[];
}

/**
 * Normalizes text for case- and accent-insensitive matching: decomposes it (NFD), strips diacritics, lowercases it,
 * and trims it.
 *
 * @param text Text to normalize.
 * @returns The normalized text.
 */
export function normalizeSearchText(text: string): string {
  return normalizeWithOffsets(text).text.trim();
}

/**
 * Normalizes text like {@link normalizeSearchText}, without trimming, and records where each normalized unit came
 * from so match ranges can be mapped back onto the original string. Characters removed by normalization, such as
 * separate combining marks, are attributed to the preceding character.
 *
 * @param text Text to normalize.
 * @returns The normalized text and its offsets into the original text.
 */
export function normalizeWithOffsets(text: string): NormalizedText {
  let normalized = '';
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;

  for (const char of text) {
    const end = offset + char.length;
    const folded = foldChar(char);
    if (folded.length === 0 && ends.length > 0) {
      ends[ends.length - 1] = end;
    }
    for (let i = 0; i < folded.length; i++) {
      starts.push(offset);
      ends.push(end);
    }
    normalized += folded;
    offset = end;
  }

  return { text: normalized, starts, ends };
}

/**
 * Maps a range of a normalized string back onto its original string.
 *
 * @param normalized Normalized text with offsets.
 * @param start Normalized start offset.
 * @param end Normalized end offset (exclusive); must be greater than `start`.
 * @returns The corresponding range of the original string.
 */
export function toOriginalRange(normalized: NormalizedText, start: number, end: number): SearchRange {
  return [normalized.starts[start], normalized.ends[end - 1]];
}

/**
 * Sorts ranges and merges overlapping or adjacent ones. Empty and inverted ranges are dropped.
 *
 * @param ranges Ranges to merge.
 * @returns Sorted, non-overlapping ranges.
 */
export function mergeRanges(ranges: readonly SearchRange[]): SearchRange[] {
  const sorted = ranges.filter(([start, end]) => end > start).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: [number, number][] = [];
  for (const [start, end] of sorted) {
    const last = merged.at(-1);
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

/**
 * Folds a single code point: decomposes it, strips combining marks, and lowercases it.
 *
 * @param char A single code point.
 * @returns The folded text, which may be empty or longer than the input.
 */
function foldChar(char: string): string {
  return char.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().replace(COMBINING_MARKS, '');
}
