import type { SearchListOption } from '@atlasng/design-system/search-list';
import type { VersionControlFileFormat } from '@atlasng/design-system/version-control';
import type { Row } from '@atlasng/design-system/table';

/** Download request emitted when a user picks a file format for a row. */
export interface KgExplorerDownloadRequest<
  TRow extends Row = Row,
  TFormat extends VersionControlFileFormat = VersionControlFileFormat,
> {
  /** Row the user chose to download. */
  item: TRow;
  /** File format the user picked. */
  format: TFormat;
}

/**
 * Values a filter compares with the labels of its selected options: a row
 * key, or a function returning the value or values of a row. Strings and
 * numbers are compared; other values are ignored.
 */
export type KgExplorerFilterField<TRow extends Row = Row> =
  (keyof TRow & string) | ((row: TRow) => string | number | readonly (string | number)[] | null | undefined);

/**
 * A filter displayed in the explorer filter menu as a multi-select filter.
 *
 * A filter with a {@link field} or {@link matches} narrows the rows of the
 * table view itself. A filter with neither only reports its selection, so the
 * consumer filters the `items` it passes in, for example on a server.
 */
export interface KgExplorerFilter<TRow extends Row = Row, T extends SearchListOption = SearchListOption> {
  /** Unique key of the filter, used for its entry in {@link KgExplorerFilterSelections}. */
  id: string;
  /** Name of the filter, shown on the button that opens its search list. */
  label: string;
  /**
   * Row values compared with the labels of the selected options. A row matches when it has the label of any
   * selected option.
   */
  field?: KgExplorerFilterField<TRow>;
  /**
   * Decides whether a row matches the selected options, instead of comparing {@link field} with their labels.
   *
   * @param row Row to test.
   * @param selected Selected options of the filter; never empty.
   * @returns Whether the row is shown.
   */
  matches?: (row: TRow, selected: readonly T[]) => boolean;
  /**
   * Options of the filter's search list. When omitted, the distinct values of {@link field} are listed in order of
   * first appearance with the number of rows that have each.
   */
  options?: T[];
  /** Whether to hide the search field of the search list, e.g. for filters with few options. */
  searchDisabled?: boolean;
  /** Number of unique items shown by the filter's counter. Defaults to the number of options. */
  count?: number;
}

/** Selected options of each filter, keyed by {@link KgExplorerFilter.id}. Filters without a key have no selection. */
export type KgExplorerFilterSelections<T extends SearchListOption = SearchListOption> = Record<string, T[]>;
