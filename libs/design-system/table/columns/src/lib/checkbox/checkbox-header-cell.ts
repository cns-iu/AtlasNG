import { Component, computed, ViewEncapsulation } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { HeaderCellDefinition, HeaderCellTemplateContext } from '@atlasng/design-system/table';

/**
 * Reusable Material checkbox header-cell definition.
 *
 * Configure it as a column's `headerTemplate`; do not also enable
 * `headerCheckboxable`, which renders ngx-datatable's native checkbox.
 */
@Component({
  selector: 'ang-table-checkbox-header-cell-definition',
  imports: [HeaderCellTemplateContext, MatCheckbox],
  template: `
    <ng-template let-allRowsSelected="allRowsSelected" let-selectFn="selectFn" angHeaderCellTemplateContext>
      <div class="ang-table--checkbox-header">
        <mat-checkbox
          aria-label="Select all rows"
          [checked]="allRowsSelected ?? false"
          [indeterminate]="!allRowsSelected && someRowsSelected()"
          (change)="selectFn()"
        />
      </div>
    </ng-template>
  `,
  styleUrl: './checkbox-header-cell.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CheckboxHeaderCellDefinition extends HeaderCellDefinition {
  /** Whether the table currently has both rows and a non-empty selection. */
  protected readonly someRowsSelected = computed(
    () => this.table.selected().length > 0 && this.table.rows().length !== 0,
  );
}
