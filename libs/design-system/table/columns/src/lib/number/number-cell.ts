import { DecimalPipe } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { CellDefinition, CellTemplateContext, type Row } from '@atlasng/design-system/table';

/**
 * Reusable localized, end-aligned number body cell.
 */
@Component({
  selector: 'ang-table-number-cell-definition',
  imports: [CellTemplateContext, DecimalPipe],
  template: `
    <ng-template let-value="value" [angCellTemplateContext]="rowType">
      <span class="ang-table--number-cell">{{ value | number }}</span>
    </ng-template>
  `,
  styleUrl: './number-cell.scss',
  encapsulation: ViewEncapsulation.None,
})
export class NumberCellDefinition<TRow extends Row = Row> extends CellDefinition<TRow> {}
