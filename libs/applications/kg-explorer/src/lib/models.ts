import type { SearchListOption } from '@atlasng/design-system/search-list';
import type { VersionControlFileFormat } from '@atlasng/design-system/version-control';
import type { Row } from '@atlasng/design-system/table';

/** Download request emitted when a user picks a file format for a row. */
export interface KgExplorerDownload<TRow extends Row = Row> {
  /** Row the user chose to download. */
  item: TRow;
  /** File format the user picked. */
  format: VersionControlFileFormat;
}

/** A filter displayed in the explorer filter menu as a multi-select filter. */
export interface KgExplorerFilter<T extends SearchListOption = SearchListOption> {
  /** Unique key of the filter, used for its entry in {@link KgExplorerFilterSelections}. */
  id: string;
  /** Name of the filter, shown on the button that opens its search list. */
  label: string;
  /** Options of the filter's search list. */
  options: T[];
  /** Whether to hide the search field of the search list, e.g. for filters with few options. */
  searchDisabled?: boolean;
  /** Number of unique items shown by the filter's counter. Defaults to the number of options. */
  count?: number;
}

/** Selected options of each filter, keyed by {@link KgExplorerFilter.id}. Filters without a key have no selection. */
export type KgExplorerFilterSelections<T extends SearchListOption = SearchListOption> = Record<string, T[]>;
