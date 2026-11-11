import { findMatchRanges, occurrences } from './match-ranges';

describe('occurrences', () => {
  it('finds non-overlapping occurrences', () => {
    expect(occurrences('aaaa', 'aa')).toEqual([0, 2]);
    expect(occurrences('heart', 'x')).toEqual([]);
  });
});

describe('findMatchRanges', () => {
  it('finds every word of the term, ignoring case and accents', () => {
    expect(findMatchRanges('Café near the cafe', 'CAFE the')).toEqual([
      [0, 4],
      [10, 13],
      [14, 18],
    ]);
  });

  it('matches words that appear even when others do not', () => {
    expect(findMatchRanges('Left Kidney', 'kidney heart')).toEqual([[5, 11]]);
  });

  it('merges overlapping matches', () => {
    expect(findMatchRanges('heartwood', 'heart twood')).toEqual([[0, 9]]);
  });

  it('returns no ranges for a blank term', () => {
    expect(findMatchRanges('Heart', '  ')).toEqual([]);
  });
});
