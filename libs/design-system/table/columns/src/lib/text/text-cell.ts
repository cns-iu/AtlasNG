import { Component, ViewEncapsulation } from '@angular/core';
import { CellDefinition, CellTemplateContext, Row } from '@atlasng/design-system/table';

/**
 * Reusable body cell that renders its value with standard table typography.
 */
@Component({
  selector: 'ang-table-text-cell-definition',
  imports: [CellTemplateContext],
  template: `
    <ng-template let-value="value" [angCellTemplateContext]="rowType">
      <div class="ang-table--text-cell">
        {{ value }}
      </div>
    </ng-template>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class TextCellDefinition<TRow extends Row = Row> extends CellDefinition<TRow> {}
