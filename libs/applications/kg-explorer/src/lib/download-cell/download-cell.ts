import { Component, ViewEncapsulation } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { CellDefinition, CellTemplateContext, type Row } from '@atlasng/design-system/table';
import type { VersionControlFileFormat } from '@atlasng/design-system/version-control';

/**
 * File formats a row can be downloaded in: the same formats for every row, or
 * a function returning the formats of a row.
 */
export type KgExplorerDownloadFormats<
  TRow extends Row = Row,
  TFormat extends VersionControlFileFormat = VersionControlFileFormat,
> = readonly TFormat[] | ((row: TRow) => readonly TFormat[]);

/** Configuration for the download cell definition. */
export interface KgExplorerDownloadCellConfig<
  TRow extends Row = Row,
  TFormat extends VersionControlFileFormat = VersionControlFileFormat,
> {
  /**
   * File formats offered for a row. A function is called while rendering, so
   * it should be cheap and return the same array for an unchanged row.
   */
  formats: KgExplorerDownloadFormats<TRow, TFormat>;
  /**
   * Invoked when a user picks a file format for a row.
   *
   * @param row Row the user chose to download.
   * @param format File format the user picked.
   */
  download: (row: TRow, format: TFormat) => void;
}

/**
 * Reusable body cell with a download icon button. A row with several formats
 * opens a menu of them, a row with one format downloads it directly, and a
 * row without formats shows a disabled button.
 */
@Component({
  selector: 'ang-kg-explorer-download-cell-definition',
  imports: [
    CellTemplateContext,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuContent,
    MatMenuItem,
    MatMenuTrigger,
    MatTooltip,
  ],
  templateUrl: './download-cell.html',
  styleUrl: './download-cell.scss',
  encapsulation: ViewEncapsulation.None,
})
export class KgExplorerDownloadCellDefinition<
  TRow extends Row = Row,
  TFormat extends VersionControlFileFormat = VersionControlFileFormat,
> extends CellDefinition<TRow, KgExplorerDownloadCellConfig<TRow, TFormat>> {
  /** Resolves the file formats offered for a row. */
  protected readonly getFormats = this.#createFormatsAccessor();

  /**
   * Creates the accessor for the formats of a row from the configured formats.
   *
   * @returns The configured function, or a function returning the configured list for every row.
   */
  #createFormatsAccessor(): (row: TRow) => readonly TFormat[] {
    if (typeof this.config.formats === 'function') {
      return this.config.formats;
    }

    const formats = this.config.formats;
    return () => formats;
  }
}
