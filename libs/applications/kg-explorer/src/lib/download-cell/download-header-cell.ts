import { Component } from '@angular/core';
import { HeaderCellDefinition, HeaderCellTemplateContext } from '@atlasng/design-system/table';
import { VisuallyHidden } from '@atlasng/cdk/a11y';

/**
 * Reusable header cell for a download column. The column `name` is the
 * header's accessible name but is visually hidden, so the header looks empty.
 */
@Component({
  selector: 'ang-kg-explorer-download-header-cell-definition',
  imports: [HeaderCellTemplateContext, VisuallyHidden],
  templateUrl: './download-header-cell.html',
})
export class KgExplorerDownloadHeaderCellDefinition extends HeaderCellDefinition {}
