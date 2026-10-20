import type { VersionControlFileFormat } from '@atlasng/design-system/version-control';
import type { Row } from '@atlasng/design-system/table';

/** Download request emitted when a user picks a file format for a row. */
export interface KgExplorerDownload<TRow extends Row = Row> {
  /** Row the user chose to download. */
  item: TRow;
  /** File format the user picked. */
  format: VersionControlFileFormat;
}
