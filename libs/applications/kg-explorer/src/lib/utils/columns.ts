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
 * Figma title column: 200px to 640px wide. Rows sort by the displayed label
 * when it comes from a row property or function.
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
    minWidth: 200,
    maxWidth: 640,
    flexGrow: 1,
    comparator: (_a: unknown, _b: unknown, rowA: TRow, rowB: TRow) => labelFor(rowA).localeCompare(labelFor(rowB)),
    cellTemplate: LinkCellDefinition,
    cellConfig: label,
    ...START_HEADER,
    ...overrides,
  };
}

/**
 * Creates a start-aligned text column that hugs its widest value, up to the
 * Figma string column's 240px.
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
    maxWidth: 240,
    fitContent: true,
    cellTemplate: TextCellDefinition,
    ...START_HEADER,
    ...overrides,
  };
}

/**
 * Creates an unsortable column that renders each array value as a stateless
 * chip, sized like the Figma tag column: 144px to 212px wide. A scalar value
 * renders a single chip and empty values render nothing.
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
    minWidth: 144,
    maxWidth: 212,
    flexGrow: 1,
    sortable: false,
    cellTemplate: ChipCellDefinition,
    ...START_HEADER,
    ...overrides,
  };
}

/**
 * Creates an end-aligned, localized number column, sized like the Figma number
 * columns: 98px to 132px wide.
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
    minWidth: 98,
    maxWidth: 132,
    flexGrow: 1,
    cellTemplate: NumberCellDefinition,
    ...END_HEADER,
    ...overrides,
  };
}

/**
 * Creates an end-aligned date column for preformatted values, sized like the
 * Figma date column: 112px to 132px wide.
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
    minWidth: 112,
    maxWidth: 132,
    flexGrow: 1,
    cellTemplate: TextCellDefinition,
    cellConfig: { align: 'end' },
    ...END_HEADER,
    ...overrides,
  };
}
