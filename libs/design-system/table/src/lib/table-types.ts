import type { PipeTransform, TemplateRef } from '@angular/core';

/** Property key identifying a column's value in a row. */
export type TableColumnProp = string | number;

/** Row displayed by the table. Rows are plain records keyed by column prop. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<TableColumnProp, any>;

/** Direction of an applied column sort. */
export type SortDirection = 'asc' | 'desc';

/** Column sort applied to the table. */
export interface SortPropDir {
  /** Prop of the sorted column. */
  prop: TableColumnProp;
  /** Sort direction. */
  dir: SortDirection;
}

/** Whether one or several columns can be sorted at once. */
export type SortType = 'single' | 'multi';

/** Row selection behavior. `checkbox` only selects through checkbox cells. */
export type SelectionType = 'single' | 'multi' | 'checkbox';

/**
 * Compares two cell values for sorting.
 *
 * @param valueA First cell value.
 * @param valueB Second cell value.
 * @param rowA Row holding the first value.
 * @param rowB Row holding the second value.
 * @returns Negative, zero, or positive number like `Array.prototype.sort`.
 */
export type TableComparator<TRow extends Row = Row> = (
  valueA: unknown,
  valueB: unknown,
  rowA: TRow,
  rowB: TRow,
) => number;

/** Column configuration with templates resolved to native template references. */
export interface ResolvedTableColumn<TRow extends Row = Row> {
  /** Header label. */
  name?: string;
  /** Row property displayed by the column. */
  prop?: TableColumnProp;
  /** Fixed width in pixels used when `flexGrow` is 0. */
  width?: number;
  /** Minimum width in pixels. */
  minWidth?: number;
  /** Maximum width in pixels. Takes precedence over `flexGrow`. */
  maxWidth?: number;
  /** Share of the remaining width. Defaults to 1. */
  flexGrow?: number;
  /** Whether the column can be sorted. Defaults to true. */
  sortable?: boolean;
  /**
   * Custom sort comparator. Declared as a method so columns typed for a specific
   * row remain assignable to columns of the base {@link Row}.
   *
   * @param valueA First cell value.
   * @param valueB Second cell value.
   * @param rowA Row holding the first value.
   * @param rowB Row holding the second value.
   * @returns Negative, zero, or positive number like `Array.prototype.sort`.
   */
  comparator?(valueA: unknown, valueB: unknown, rowA: TRow, rowB: TRow): number;
  /** Computes the summary cell from all column values; `null` disables the summary. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  summaryFunc?: ((cells: any[]) => any) | null;
  /** Pipe applied to body-cell values before they reach the cell template. */
  pipe?: PipeTransform;
  /** Extra classes applied to the body cells. */
  cellClass?: string;
  /** Extra classes applied to the header cell. */
  headerClass?: string;
  /** Template rendering body cells. */
  cellTemplate?: TemplateRef<CellContext<TRow>>;
  /** Template rendering the header cell. */
  headerTemplate?: TemplateRef<HeaderCellContext>;
  /** Template rendering the summary cell. */
  summaryTemplate?: TemplateRef<CellContext>;
}

/** Context passed to body-cell and summary-cell templates. */
export interface CellContext<TRow extends Row = Row> {
  /** Row displayed by the cell. Summary cells receive the computed summary values. */
  row: TRow;
  /** Cell value read from `row[column.prop]`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  /** Column displayed by the cell. */
  column: ResolvedTableColumn<TRow>;
  /** Index of the row in the sorted rows. */
  rowIndex: number;
  /** Whether the row is selected. */
  isSelected?: boolean;
  /** Whether the row is disabled. */
  disabled?: boolean;
  /** Toggles the row selection; bound to checkbox cells. */
  onCheckboxChangeFn: (event: Event) => void;
}

/** Context passed to header-cell templates. */
export interface HeaderCellContext {
  /** Column displayed by the header. */
  column: ResolvedTableColumn;
  /** Current sort direction of the column. */
  sortDir: SortDirection | undefined;
  /** Advances the column sort: ascending, descending, then unsorted. */
  sortFn: () => void;
  /** Whether every row is selected. */
  allRowsSelected?: boolean;
  /** Selects all rows, or clears the selection when all are selected. */
  selectFn: () => void;
}
