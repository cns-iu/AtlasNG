import { Component, computed, TemplateRef, viewChild } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { HeaderCellDefinition, HeaderCellTemplateContext, type HeaderCellContext } from '@atlasng/design-system/table';

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
    <ng-template let-allRowsSelected="allRowsSelected" let-selectFn="selectFn" angHeaderCellTemplateContext #template>
      <mat-checkbox
        class="ang-table--checkbox-header"
        aria-label="Select all rows"
        [checked]="allRowsSelected ?? false"
        [indeterminate]="!allRowsSelected && someRowsSelected()"
        (change)="selectFn()"
      />
    </ng-template>
  `,
})
export class CheckboxHeaderCellDefinition extends HeaderCellDefinition {
  /** Template rendered for the checkbox column header. */
  readonly template = viewChild.required<TemplateRef<HeaderCellContext>>('template');

  protected readonly someRowsSelected = computed(
    () => this.table.selected().length > 0 && this.table.rows().length !== 0,
  );
}
