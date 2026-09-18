import { Component, ViewEncapsulation } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { CellDefinition, CellTemplateContext, type Row } from '@atlasng/design-system/table';

/**
 * Reusable Material checkbox body-cell definition.
 *
 * Configure it as a column's `cellTemplate`; do not also enable ngx-datatable's
 * `checkboxable` flag because that flag renders a second native checkbox.
 */
@Component({
  selector: 'ang-table-checkbox-cell-definition',
  imports: [CellTemplateContext, MatCheckbox],
  template: `
    <ng-template
      let-disabled="disabled"
      let-isSelected="isSelected"
      let-onCheckboxChangeFn="onCheckboxChangeFn"
      [angCellTemplateContext]="rowType"
    >
      <div class="ang-table--checkbox-cell">
        <mat-checkbox
          aria-label="Select row"
          [checked]="isSelected ?? false"
          [disabled]="disabled ?? false"
          (click)="onCheckboxChangeFn($event)"
        />
      </div>
    </ng-template>
  `,
  styleUrl: './checkbox-cell.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CheckboxCellDefinition<TRow extends Row = Row> extends CellDefinition<TRow> {}
