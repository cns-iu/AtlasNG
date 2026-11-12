import { createRowFilter, deriveFilterOptions } from './filtering';
import type { KgExplorerFilter } from '../models';

interface TestRow {
  [key: string]: unknown;
  type: string;
  tags: string[];
  year: number;
}

const ROWS: TestRow[] = [
  { type: 'Dataset', tags: ['Kidney', 'Lung'], year: 2024 },
  { type: 'Atlas', tags: ['Kidney', 'Kidney'], year: 2025 },
  { type: 'Dataset', tags: [], year: 2025 },
];

const FILTERS: KgExplorerFilter<TestRow>[] = [
  { id: 'type', label: 'Type', field: 'type' },
  { id: 'organ', label: 'Organ', field: (row) => row.tags },
  { id: 'recent', label: 'Recent', matches: (row, selected) => selected.some((option) => row.year >= +option.label) },
  { id: 'external', label: 'External', options: [{ label: 'Anything' }] },
];

describe('createRowFilter', () => {
  it('returns nothing when no filter restricts the rows', () => {
    expect(createRowFilter(FILTERS, {})).toBeUndefined();
    expect(createRowFilter(FILTERS, { type: [], external: [{ label: 'Anything' }] })).toBeUndefined();
  });

  it('matches any selected option within a filter', () => {
    const filter = createRowFilter(FILTERS, { organ: [{ label: 'Lung' }, { label: 'Kidney' }] });

    expect(ROWS.filter((row) => filter?.(row))).toEqual([ROWS[0], ROWS[1]]);
  });

  it('requires every filter with a selection to match', () => {
    const filter = createRowFilter(FILTERS, { type: [{ label: 'Dataset' }], organ: [{ label: 'Kidney' }] });

    expect(ROWS.filter((row) => filter?.(row))).toEqual([ROWS[0]]);
  });

  it('uses the matches function of a filter', () => {
    const filter = createRowFilter(FILTERS, { recent: [{ label: '2025' }] });

    expect(ROWS.filter((row) => filter?.(row))).toEqual([ROWS[1], ROWS[2]]);
  });
});

describe('deriveFilterOptions', () => {
  it('lists distinct values with the number of rows that have them', () => {
    expect(deriveFilterOptions(ROWS, 'tags')).toEqual([
      { label: 'Kidney', count: 2 },
      { label: 'Lung', count: 1 },
    ]);
  });

  it('reads numbers and ignores other values', () => {
    expect(deriveFilterOptions(ROWS, 'year')).toEqual([
      { label: '2024', count: 1 },
      { label: '2025', count: 2 },
    ]);
    expect(deriveFilterOptions(ROWS, () => null)).toEqual([]);
  });
});
