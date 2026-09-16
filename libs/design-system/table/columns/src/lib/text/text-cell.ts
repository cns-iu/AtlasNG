import { Component, ViewEncapsulation } from '@angular/core';
import { CellDefinition, CellTemplateContext, Row } from '@atlasng/design-system/table';

/**
 * Reusable body cell that renders its value with standard table typography.
 *
 * @typeParam TRow Row represented by the text cell.
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
  styleUrl: './text-cell.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TextCellDefinition<TRow extends Row = Row> extends CellDefinition<TRow> {}
