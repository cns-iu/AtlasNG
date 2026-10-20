import { LinkCellDefinition, NumberCellDefinition, TextCellDefinition } from '@atlasng/design-system/table/columns';
import {
  kgExplorerDateColumn,
  kgExplorerLinkColumn,
  kgExplorerListColumn,
  kgExplorerNumberColumn,
  kgExplorerTextColumn,
} from './columns';

interface TestRow {
  name: string;
  url: string;
  tags: string[];
  count: number;
  date: string;
}

const ADA: TestRow = { name: 'Ada', url: '/ada', tags: ['Kidney', 'Lung'], count: 1, date: '2026-01' };
const GRACE: TestRow = { name: 'Grace', url: '/grace', tags: [], count: 2, date: '2026-02' };

describe('kgExplorer column builders', () => {
  it('builds link columns that sort by the displayed label', () => {
    const byProp = kgExplorerLinkColumn<TestRow>('Name', 'url', { labelProp: 'name' });
    const byFn = kgExplorerLinkColumn<TestRow>('Name', 'url', { labelFn: (row) => row.name.toUpperCase() });
    const byLabel = kgExplorerLinkColumn<TestRow>('Name', 'url', { label: 'Open' }, { maxWidth: 400 });

    expect(byProp).toMatchObject({ name: 'Name', prop: 'url', minWidth: 200, maxWidth: 640 });
    expect(byProp.cellTemplate).toBe(LinkCellDefinition);
    expect(byProp.comparator?.(undefined, undefined, ADA, GRACE)).toBeLessThan(0);
    expect(byFn.comparator?.(undefined, undefined, GRACE, ADA)).toBeGreaterThan(0);
    expect(byLabel.comparator?.(undefined, undefined, ADA, GRACE)).toBe(0);
    expect(byLabel.maxWidth).toBe(400);
  });

  it('builds text, number, and date columns with Figma widths', () => {
    expect(kgExplorerTextColumn<TestRow>('Name', 'name')).toMatchObject({
      minWidth: 156,
      maxWidth: 240,
      cellTemplate: TextCellDefinition,
    });
    expect(kgExplorerNumberColumn<TestRow>('Count', 'count')).toMatchObject({
      minWidth: 98,
      maxWidth: 132,
      cellTemplate: NumberCellDefinition,
      headerConfig: { align: 'end' },
    });
    expect(kgExplorerDateColumn<TestRow>('Date', 'date')).toMatchObject({
      minWidth: 112,
      maxWidth: 132,
      cellConfig: { align: 'end' },
    });
  });

  it('builds unsortable list columns that join array values', () => {
    const column = kgExplorerListColumn<TestRow>('Tags', 'tags');

    expect(column.sortable).toBe(false);
    expect(column.pipe?.transform(ADA.tags)).toBe('Kidney, Lung');
    expect(column.pipe?.transform('Skin')).toBe('Skin');
  });
});
