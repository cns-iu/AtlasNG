import { mergeRanges, normalizeSearchText, normalizeWithOffsets, toOriginalRange } from './normalize';

describe('normalizeSearchText', () => {
  it.each([
    ['  Café  ', 'cafe'],
    ['ÅNGSTRÖM', 'angstrom'],
    ['İstanbul', 'istanbul'],
    ['naïve résumé', 'naive resume'],
    ['', ''],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeSearchText(input)).toBe(expected);
  });
});

describe('normalizeWithOffsets', () => {
  it('maps precomposed characters to their original offsets', () => {
    const normalized = normalizeWithOffsets('Café au lait');
    expect(normalized.text).toBe('cafe au lait');
    expect(toOriginalRange(normalized, 2, 4)).toEqual([2, 4]);
  });

  it('attributes stripped combining marks to the preceding character', () => {
    const original = 'Café noir';
    const normalized = normalizeWithOffsets(original);
    expect(normalized.text).toBe('cafe noir');
    const [start, end] = toOriginalRange(normalized, 0, 4);
    expect(original.slice(start, end)).toBe('Café');
    expect(toOriginalRange(normalized, 5, 9)).toEqual([6, 10]);
  });

  it('keeps surrogate pairs together', () => {
    const original = '😀 smile';
    const normalized = normalizeWithOffsets(original);
    expect(normalized.text).toBe(original);
    expect(toOriginalRange(normalized, 0, 1)).toEqual([0, 2]);
  });

  it('drops leading combining marks', () => {
    expect(normalizeWithOffsets('́a').text).toBe('a');
  });
});

describe('mergeRanges', () => {
  it('sorts, merges, and drops empty ranges', () => {
    expect(
      mergeRanges([
        [5, 7],
        [0, 2],
        [1, 3],
        [3, 4],
        [8, 8],
        [9, 6],
      ]),
    ).toEqual([
      [0, 4],
      [5, 7],
    ]);
  });
});
