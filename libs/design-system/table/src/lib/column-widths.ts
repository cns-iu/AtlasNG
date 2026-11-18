import type { TableColumn as NgxTableColumn } from '@swimlane/ngx-datatable';

/** Column settings that decide a column's width. */
export type ColumnSizing = Pick<NgxTableColumn, 'width' | 'minWidth' | 'maxWidth' | 'flexGrow' | 'canAutoResize'> & {
  /** Sizes the column to its widest cell, measured from its `max-content` track, instead of growing. */
  fitContent?: boolean;
};

/** Width ngx-datatable gives a column that sets no `width`. */
const DEFAULT_COLUMN_WIDTH = 150;

/**
 * Adds up numbers.
 *
 * @param values Numbers to add.
 * @returns Their sum.
 */
function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Clamps a width between a column's minimum and maximum widths. The minimum
 * wins when it is larger than the maximum, as in CSS.
 *
 * @param column Column whose limits apply.
 * @param width Width to clamp.
 * @returns The clamped width.
 */
function clampWidth(column: ColumnSizing, width: number): number {
  return Math.max(column.minWidth ?? 0, Math.min(width, column.maxWidth ?? Infinity));
}

/**
 * Checks whether a column shares the table's width.
 *
 * @param column Column to check.
 * @returns Whether the column grows with the table.
 */
function grows(column: ColumnSizing): boolean {
  return !column.fitContent && (column.flexGrow ?? 0) > 0 && column.canAutoResize !== false;
}

/**
 * Picks the width of a column that doesn't grow: its content width when it
 * fits its content, otherwise its `width`, within its limits.
 *
 * @param column Column to size.
 * @param contentWidth Measured `max-content` width of the column, if any.
 * @returns The column's width.
 */
function fixedWidth(column: ColumnSizing, contentWidth: number | undefined): number {
  if (!column.fitContent) {
    return clampWidth(column, column.width ?? DEFAULT_COLUMN_WIDTH);
  }

  // Until its content is measured, the column is as wide as it may be.
  const width = contentWidth !== undefined && Number.isFinite(contentWidth) ? contentWidth : column.maxWidth;
  return clampWidth(column, width ?? DEFAULT_COLUMN_WIDTH);
}

/**
 * Lays out columns like CSS flexbox items with `flex: <flexGrow> 0 0` and the
 * columns' `minWidth` and `maxWidth`:
 *
 * - Columns with a positive `flexGrow` start at zero and share the available
 *   width in proportion to their `flexGrow`. A column that reaches its
 *   `minWidth` or `maxWidth` stops there, and the others share what is left.
 * - Columns with `fitContent` take their measured content width, and other
 *   columns, including columns with `canAutoResize: false`, keep their
 *   `width` (150px when unset), within their `minWidth` and `maxWidth`.
 * - When the minimum widths don't fit, every column stays at its minimum and
 *   the columns overflow, so the table scrolls sideways. When every column
 *   reaches its maximum, the remaining width is left over; the table spreads
 *   it between the columns.
 *
 * ngx-datatable's own `flex` column mode ignores `maxWidth` while it shares
 * the width
 * ({@link https://github.com/swimlane/ngx-datatable/issues/2297 | swimlane/ngx-datatable#2297}).
 *
 * @param columns Columns in display order.
 * @param availableWidth Width the columns can fill, in pixels.
 * @param contentWidths Measured `max-content` widths of the `fitContent` columns, by index; see {@link contentMeasureTemplate}.
 * @returns Each column's width in pixels, in the order of `columns`.
 */
export function resolveColumnWidths(
  columns: readonly ColumnSizing[],
  availableWidth: number,
  contentWidths: readonly number[] = [],
): number[] {
  const widths = columns.map((column, index) => (grows(column) ? 0 : fixedWidth(column, contentWidths[index])));
  let growing = columns.flatMap((column, index) => (grows(column) ? [index] : []));

  while (growing.length > 0) {
    const usedWidth = sum(widths.filter((_width, index) => !growing.includes(index)));
    const freeWidth = Math.max(availableWidth - usedWidth, 0);
    const totalGrow = sum(growing.map((index) => columns[index].flexGrow ?? 0));
    const adjustments = growing.map((index) => {
      const share = (freeWidth * (columns[index].flexGrow ?? 0)) / totalGrow;
      widths[index] = clampWidth(columns[index], share);
      return widths[index] - share;
    });

    // Like CSS flexbox, stop the columns clamped in the direction of the
    // total adjustment, or every column when the adjustments cancel out.
    const direction = Math.sign(sum(adjustments));
    growing = growing.filter((_index, i) => direction !== 0 && Math.sign(adjustments[i]) !== direction);
  }

  return widths;
}

/**
 * Builds a CSS grid `grid-template-columns` value from
 * {@link resolveColumnWidths}. Growing columns between their limits get `fr`
 * tracks in proportion to their `flexGrow`, so the grid shares the exact
 * remaining width without rounding overflow, and keeps sharing it while the
 * table resizes before the widths are resolved again. Every other column gets
 * a pixel track.
 *
 * @param columns Columns in display order.
 * @param availableWidth Width the columns can fill, in pixels.
 * @param contentWidths Measured `max-content` widths of the `fitContent` columns, by index.
 * @returns Space-separated track sizes, one per column.
 */
export function columnGridTemplate(
  columns: readonly ColumnSizing[],
  availableWidth: number,
  contentWidths: readonly number[] = [],
): string {
  const widths = resolveColumnWidths(columns, availableWidth, contentWidths);
  const flexible = columns.map(
    (column, index) =>
      grows(column) && widths[index] > (column.minWidth ?? 0) && widths[index] < (column.maxWidth ?? Infinity),
  );
  // The smallest factor becomes 1fr, because factors adding up to less than 1 leave part of the width unused.
  const smallestGrow = Math.min(
    ...columns.filter((_column, index) => flexible[index]).map((column) => column.flexGrow ?? 1),
  );

  return columns
    .map((column, index) =>
      flexible[index] ? `minmax(0, ${(column.flexGrow ?? 1) / smallestGrow}fr)` : `${widths[index]}px`,
    )
    .join(' ');
}

/**
 * Builds a temporary `grid-template-columns` value that sizes each
 * `fitContent` column to its widest cell, so its width can be read back from
 * the grid's computed tracks before {@link columnGridTemplate} lays out the
 * columns. A `max-content` minimum doesn't depend on the other tracks.
 *
 * @param columns Columns in display order.
 * @returns Space-separated track sizes, one per column.
 */
export function contentMeasureTemplate(columns: readonly ColumnSizing[]): string {
  return columns.map((column) => (column.fitContent ? 'max-content' : '0px')).join(' ');
}
