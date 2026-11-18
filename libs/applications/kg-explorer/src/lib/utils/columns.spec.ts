import {
  ChipCellDefinition,
  LinkCellDefinition,
  NumberCellDefinition,
  TextCellDefinition,
} from '@atlasng/design-system/table/columns';
import {
  kgExplorerChipColumn,
  kgExplorerDateColumn,
  kgExplorerLinkColumn,
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
    const byLabel = kgExplorerLinkColumn<TestRow>('Name', 'url', { label: 'Open' }, { flexGrow: 2 });

    expect(byProp).toMatchObject({ name: 'Name', prop: 'url', minWidth: 200, maxWidth: 640, flexGrow: 1 });
    expect(byProp.cellTemplate).toBe(LinkCellDefinition);
    expect(byProp.comparator?.(undefined, undefined, ADA, GRACE)).toBeLessThan(0);
    expect(byFn.comparator?.(undefined, undefined, GRACE, ADA)).toBeGreaterThan(0);
    expect(byLabel.comparator?.(undefined, undefined, ADA, GRACE)).toBe(0);
    expect(byLabel.flexGrow).toBe(2);
  });

  it('builds content-sized text columns and growing number and date columns', () => {
    expect(kgExplorerTextColumn<TestRow>('Name', 'name')).toMatchObject({
      cellTemplate: TextCellDefinition,
      maxWidth: 240,
      fitContent: true,
    });
    expect(kgExplorerNumberColumn<TestRow>('Count', 'count')).toMatchObject({
      cellTemplate: NumberCellDefinition,
      headerConfig: { align: 'end' },
      minWidth: 98,
      maxWidth: 148,
      flexGrow: 1,
    });
    expect(kgExplorerDateColumn<TestRow>('Date', 'date')).toMatchObject({
      cellConfig: { align: 'end' },
      minWidth: 120,
      maxWidth: 152,
      flexGrow: 1,
    });
  });

  it('lets overrides replace the default sizing', () => {
    expect(kgExplorerNumberColumn<TestRow>('Count', 'count', { maxWidth: 164, flexGrow: 2 })).toMatchObject({
      minWidth: 98,
      maxWidth: 164,
      flexGrow: 2,
    });
  });

  it('builds unsortable chip columns', () => {
    const column = kgExplorerChipColumn<TestRow>('Tags', 'tags');

    expect(column).toMatchObject({
      sortable: false,
      minWidth: 144,
      maxWidth: 212,
      flexGrow: 1,
      cellTemplate: ChipCellDefinition,
    });
    expect(column.pipe).toBeUndefined();
  });
});
