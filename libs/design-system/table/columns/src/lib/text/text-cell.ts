import { Component, ViewEncapsulation } from '@angular/core';
import { CellDefinition, CellTemplateContext, Row } from '@atlasng/design-system/table';
import type { TextHeaderAlignment } from './text-header-cell';

/** Configuration for the standard text cell definition. */
export interface TextCellConfig {
  /** Logical alignment of the cell text. Defaults to `'start'`. */
  align?: TextHeaderAlignment;
}

/**
 * Reusable body cell that renders its value with standard table typography
 * and optional logical alignment.
 */
@Component({
  selector: 'ang-table-text-cell-definition',
  imports: [CellTemplateContext],
  template: `
    @let alignClass = 'ang-table--text-cell-align-' + (config?.align ?? 'start');

    <ng-template let-value="value" [angCellTemplateContext]="rowType">
      <div class="ang-table--text-cell" [class]="alignClass">
        {{ value }}
      </div>
    </ng-template>
  `,
  styleUrl: './text-cell.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TextCellDefinition<TRow extends Row = Row> extends CellDefinition<TRow, TextCellConfig | undefined> {}
