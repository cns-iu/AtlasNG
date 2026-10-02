import { Component, ViewEncapsulation } from '@angular/core';
import { CellDefinition, CellTemplateContext, type Row } from '@atlasng/design-system/table';

/**
 * Reusable start-aligned body cell that renders its value as inline code
 * using mono typography on a filled, rounded surface.
 */
@Component({
  selector: 'ang-table-code-cell-definition',
  imports: [CellTemplateContext],
  template: `
    <ng-template let-value="value" [angCellTemplateContext]="rowType">
      <code class="ang-table--code-cell">{{ value }}</code>
    </ng-template>
  `,
  styleUrl: './code-cell.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CodeCellDefinition<TRow extends Row = Row> extends CellDefinition<TRow> {}
