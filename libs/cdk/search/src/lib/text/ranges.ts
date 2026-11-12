import { SearchRange } from '../engine/types';

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
