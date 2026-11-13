import type { Row, TableColumn } from '@atlasng/design-system/table';
import {
  ChipCellDefinition,
  LinkCellDefinition,
  NumberCellDefinition,
  TextCellDefinition,
  TextHeaderCellDefinition,
  type LinkCellConfig,
} from '@atlasng/design-system/table/columns';

/** Column settings that override the defaults applied by a column builder. */
type KgExplorerColumnOverrides<TRow extends Row = Row> = Partial<TableColumn<TRow>>;

/** Start-aligned sortable text header. */
const START_HEADER = { headerTemplate: TextHeaderCellDefinition, headerConfig: { align: 'start' } } as const;

/** End-aligned sortable text header. */
const END_HEADER = { headerTemplate: TextHeaderCellDefinition, headerConfig: { align: 'end' } } as const;

/**
 * Creates a column whose cells link to the row property's value, sized like the
 * Figma title column. It shares the table's extra width with the chip columns.
 * Rows sort by the displayed label when it comes from a
 * row property or function.
 *
 * Build columns once and reuse the array; the table caches cell templates by
 * column identity.
 *
 * @param name Header label.
 * @param prop Row property holding the link command, such as a URL.
 * @param label Static label, `labelProp`, or `labelFn` for the link text.
 * @param overrides Column settings replacing the defaults.
 * @returns Link column definition.
 */
export function kgExplorerLinkColumn<TRow extends Row = Row>(
  name: string,
  prop: keyof TRow & string,
  label: LinkCellConfig<TRow>,
  overrides: KgExplorerColumnOverrides<TRow> = {},
): TableColumn<TRow> {
  const labelFor = (row: TRow): string =>
    label.labelFn?.(row) ?? (label.labelProp !== undefined ? String(row[label.labelProp] ?? '') : (label.label ?? ''));

  return {
    name,
    prop,
    minWidth: 140,
    flexGrow: 1,
    comparator: (_a: unknown, _b: unknown, rowA: TRow, rowB: TRow) => labelFor(rowA).localeCompare(labelFor(rowB)),
    cellTemplate: LinkCellDefinition,
    cellConfig: label,
    ...START_HEADER,
    ...overrides,
  };
}

/**
 * Creates a start-aligned text column with the fixed width of the Figma string
 * column.
 *
 * @param name Header label.
 * @param prop Row property displayed in the cells.
 * @param overrides Column settings replacing the defaults.
 * @returns Text column definition.
 */
export function kgExplorerTextColumn<TRow extends Row = Row>(
  name: string,
  prop: keyof TRow & string,
  overrides: KgExplorerColumnOverrides<TRow> = {},
): TableColumn<TRow> {
  return {
    name,
    prop,
    width: 140,
    minWidth: 140,
    flexGrow: 0,
    cellTemplate: TextCellDefinition,
    ...START_HEADER,
    ...overrides,
  };
}

/**
 * Creates an unsortable column that renders each array value as a stateless
 * chip, like the Figma Organs column. A scalar value renders a single chip and
 * empty values render nothing.
 *
 * @param name Header label.
 * @param prop Row property holding the chip values.
 * @param overrides Column settings replacing the defaults.
 * @returns Chip column definition.
 */
export function kgExplorerChipColumn<TRow extends Row = Row>(
  name: string,
  prop: keyof TRow & string,
  overrides: KgExplorerColumnOverrides<TRow> = {},
): TableColumn<TRow> {
  return {
    name,
    prop,
    flexGrow: 1,
    minWidth: 248,
    sortable: false,
    cellTemplate: ChipCellDefinition,
    ...START_HEADER,
    ...overrides,
  };
}

/**
 * Creates an end-aligned, localized number column with the fixed width of the
 * Figma number columns.
 *
 * @param name Header label.
 * @param prop Row property holding the number.
 * @param overrides Column settings replacing the defaults.
 * @returns Number column definition.
 */
export function kgExplorerNumberColumn<TRow extends Row = Row>(
  name: string,
  prop: keyof TRow & string,
  overrides: KgExplorerColumnOverrides<TRow> = {},
): TableColumn<TRow> {
  return {
    name,
    prop,
    width: 96,
    minWidth: 96,
    flexGrow: 0,
    cellTemplate: NumberCellDefinition,
    ...END_HEADER,
    ...overrides,
  };
}

/**
 * Creates an end-aligned date column for preformatted values, with the fixed
 * width of the Figma date column.
 *
 * @param name Header label.
 * @param prop Row property holding the formatted date.
 * @param overrides Column settings replacing the defaults.
 * @returns Date column definition.
 */
export function kgExplorerDateColumn<TRow extends Row = Row>(
  name: string,
  prop: keyof TRow & string,
  overrides: KgExplorerColumnOverrides<TRow> = {},
): TableColumn<TRow> {
  return {
    name,
    prop,
    width: 136,
    minWidth: 136,
    flexGrow: 0,
    cellTemplate: TextCellDefinition,
    cellConfig: { align: 'end' },
    ...END_HEADER,
    ...overrides,
  };
}
