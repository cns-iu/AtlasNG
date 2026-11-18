import { columnGridTemplate, contentMeasureTemplate, resolveColumnWidths, type ColumnSizing } from './column-widths';

/** Columns of the Figma KG Explorer table: download, title, type, tags, two numbers, and date. */
const FIGMA_COLUMNS: ColumnSizing[] = [
  { width: 40, flexGrow: 0 },
  { minWidth: 200, maxWidth: 640, flexGrow: 1 },
  { minWidth: 156, maxWidth: 240, flexGrow: 1 },
  { minWidth: 144, maxWidth: 212, flexGrow: 1 },
  { minWidth: 98, maxWidth: 132, flexGrow: 1 },
  { minWidth: 98, maxWidth: 132, flexGrow: 1 },
  { minWidth: 112, maxWidth: 132, flexGrow: 1 },
];

describe('resolveColumnWidths', () => {
  it('shares the width equally until columns reach their limits, like the Figma table', () => {
    expect(resolveColumnWidths(FIGMA_COLUMNS, 1200)).toEqual([40, 312, 240, 212, 132, 132, 132]);
    expect(resolveColumnWidths(FIGMA_COLUMNS, 1000)).toEqual([40, 200, 182, 182, 132, 132, 132]);
  });

  it('stops every column at its maximum when the table is wider than the maximums', () => {
    expect(resolveColumnWidths(FIGMA_COLUMNS, 1600)).toEqual([40, 640, 240, 212, 132, 132, 132]);
  });

  it('keeps every column at its minimum when the minimums do not fit', () => {
    expect(resolveColumnWidths(FIGMA_COLUMNS, 400)).toEqual([40, 200, 156, 144, 98, 98, 112]);
  });

  it('shares the width in proportion to flexGrow', () => {
    expect(resolveColumnWidths([{ flexGrow: 1 }, { flexGrow: 3 }], 400)).toEqual([100, 300]);
  });

  it('keeps the width of columns that do not grow or resize', () => {
    expect(
      resolveColumnWidths([{}, { width: 80, canAutoResize: false, flexGrow: 1 }, { width: 10, minWidth: 20 }], 500),
    ).toEqual([150, 80, 20]);
  });

  it('sizes fitContent columns to their measured content within their limits', () => {
    const columns: ColumnSizing[] = [
      { fitContent: true, maxWidth: 240 },
      { fitContent: true, minWidth: 100 },
      { fitContent: true, maxWidth: 120 },
      { flexGrow: 1 },
    ];

    expect(resolveColumnWidths(columns, 1000, [139.5, 60, 300])).toEqual([139.5, 100, 120, 640.5]);
    expect(resolveColumnWidths(columns, 1000)).toEqual([240, 150, 120, 490]);
  });

  it('lets the minimum win over a smaller maximum', () => {
    expect(resolveColumnWidths([{ minWidth: 120, maxWidth: 100, flexGrow: 1 }], 50)).toEqual([120]);
  });
});

describe('columnGridTemplate', () => {
  it('uses fr tracks for growing columns and pixel tracks for the rest', () => {
    expect(columnGridTemplate(FIGMA_COLUMNS, 1200)).toBe('40px minmax(0, 1fr) 240px 212px 132px 132px 132px');
  });

  it('keeps the flexGrow ratio of growing columns, with the smallest at 1fr', () => {
    expect(columnGridTemplate([{ flexGrow: 0.5 }, { flexGrow: 1.5 }], 400)).toBe('minmax(0, 1fr) minmax(0, 3fr)');
  });

  it('uses pixel tracks when every column is at a limit', () => {
    expect(columnGridTemplate(FIGMA_COLUMNS, 400)).toBe('40px 200px 156px 144px 98px 98px 112px');
  });
});

describe('contentMeasureTemplate', () => {
  it('measures fitContent columns at their max-content width', () => {
    expect(contentMeasureTemplate([{ fitContent: true }, { flexGrow: 1 }])).toBe('max-content 0px');
  });
});
