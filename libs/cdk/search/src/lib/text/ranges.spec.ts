import { mergeRanges } from './ranges';

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
