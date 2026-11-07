import { Component, ViewEncapsulation } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { CellDefinition, CellTemplateContext, type Row } from '@atlasng/design-system/table';
import type { VersionControlFileFormat } from '@atlasng/design-system/version-control';

/** Configuration for the download cell definition. */
export interface DownloadCellConfig<TRow extends Row = Row> {
  /** File formats offered in the download menu. */
  formats: readonly VersionControlFileFormat[];
  /**
   * Invoked when a user picks a file format for a row.
   *
   * @param row Row the user chose to download.
   * @param format File format the user picked.
   */
  download: (row: TRow, format: VersionControlFileFormat) => void;
}

/**
 * Reusable body cell with an icon button that opens a menu of download formats.
 */
@Component({
  selector: 'ang-kg-explorer-download-cell-definition',
  imports: [CellTemplateContext, MatIcon, MatIconButton, MatMenu, MatMenuItem, MatMenuTrigger, MatTooltip],
  templateUrl: './download-cell.html',
  styleUrl: './download-cell.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DownloadCellDefinition<TRow extends Row = Row> extends CellDefinition<TRow, DownloadCellConfig<TRow>> {}
