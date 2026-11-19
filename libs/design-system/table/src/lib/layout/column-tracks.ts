import type { TableColumn as NgxTableColumn } from '@swimlane/ngx-datatable';

/** Column settings that decide a column's grid track and its place in the grid. */
export type ColumnTrackSizing = Pick<
  NgxTableColumn,
  'width' | 'minWidth' | 'maxWidth' | 'flexGrow' | 'canAutoResize' | 'frozenLeft' | 'frozenRight'
> & {
  /** Sizes the column to its widest cell instead of growing. */
  fitContent?: boolean;
};

/** Width ngx-datatable gives a column that sets no `width`. */
const DEFAULT_COLUMN_WIDTH = 150;

/**
 * Orders columns the way ngx-datatable renders them: frozen left, unfrozen,
 * then frozen right.
 *
 * @param columns Columns in input order.
 * @returns Columns in render order.
 */
function inRenderOrder(columns: readonly ColumnTrackSizing[]): ColumnTrackSizing[] {
  return [
    ...columns.filter((column) => column.frozenLeft),
    ...columns.filter((column) => !column.frozenLeft && !column.frozenRight),
    ...columns.filter((column) => !column.frozenLeft && column.frozenRight),
  ];
}

/**
 * Builds one column's grid track.
 *
 * @param column Column to size.
 * @returns The column's track size.
 */
function columnTrack(column: ColumnTrackSizing): string {
  // A fit-content() track would shrink below its content to share the width with the growing columns.
  if (column.fitContent) {
    return 'max-content';
  }

  const minWidth = column.minWidth ?? 0;
  if ((column.flexGrow ?? 0) > 0 && column.canAutoResize !== false) {
    const max = column.maxWidth === undefined ? `${column.flexGrow}fr` : `${column.maxWidth}px`;
    return `minmax(${minWidth}px, ${max})`;
  }

  const width = Math.min(column.width ?? DEFAULT_COLUMN_WIDTH, column.maxWidth ?? Infinity);
  return `${Math.max(minWidth, width)}px`;
}

/**
 * Builds the table grid's `grid-template-columns` from the column settings
 * alone, so the browser sizes the columns without measuring them in script.
 * ngx-datatable's own `flex` column mode ignores `maxWidth` while it shares
 * the width
 * ({@link https://github.com/swimlane/ngx-datatable/issues/2297 | swimlane/ngx-datatable#2297}).
 *
 * - Growing columns, with a positive `flexGrow`, start at their `minWidth`
 *   and share the remaining width equally up to their `maxWidth`. Without a
 *   `maxWidth`, they share what the other columns leave in proportion to
 *   their `flexGrow`.
 * - Columns with `fitContent` hug their widest cell; their `minWidth` and
 *   `maxWidth` don't apply.
 * - Other columns, including columns with `canAutoResize: false`, keep their
 *   `width` (150px when unset), within their `minWidth` and `maxWidth`.
 *
 * @param columns Columns in input order.
 * @returns Space-separated track sizes, one per column, in render order.
 */
export function columnTracks(columns: readonly ColumnTrackSizing[]): string {
  return inRenderOrder(columns).map(columnTrack).join(' ');
}
