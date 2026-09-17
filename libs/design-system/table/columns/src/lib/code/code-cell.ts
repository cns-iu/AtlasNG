import { Component } from '@angular/core';
import { CellDefinition, CellTemplateContext, type Row } from '@atlasng/design-system/table';

/**
 * Empty reusable code-cell scaffold reserved for a future content implementation.
 */
@Component({
  selector: 'ang-table-code-cell-definition',
  imports: [CellTemplateContext],
  template: `<ng-template [angCellTemplateContext]="rowType" />`,
})
export class CodeCellDefinition<TRow extends Row = Row> extends CellDefinition<TRow> {}
