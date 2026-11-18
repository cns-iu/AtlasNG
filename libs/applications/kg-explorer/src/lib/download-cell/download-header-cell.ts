import { Component, ViewEncapsulation } from '@angular/core';
import { HeaderCellDefinition, HeaderCellTemplateContext } from '@atlasng/design-system/table';

/**
 * Reusable header cell for a download column. The column `name` is the
 * header's accessible name but is visually hidden, so the header looks empty.
 */
@Component({
  selector: 'ang-kg-explorer-download-header-cell-definition',
  imports: [HeaderCellTemplateContext],
  templateUrl: './download-header-cell.html',
  styleUrl: './download-header-cell.scss',
  encapsulation: ViewEncapsulation.None,
})
export class KgExplorerDownloadHeaderCellDefinition extends HeaderCellDefinition {}
