import { Component, computed, ViewEncapsulation } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { EventScope, TrackChange } from '@atlasng/analytics';
import { HeaderCellDefinition, HeaderCellTemplateContext } from '@atlasng/design-system/table';

/** Configuration for the checkbox header-cell definition. */
export interface CheckboxHeaderCellConfig {
  /** Accessible name of the select-all checkbox. Defaults to "Select all rows". */
  label?: string;
}

/**
 * Reusable Material checkbox header-cell definition.
 *
 * Configure it as a column's `headerTemplate`; do not also enable
 * `headerCheckboxable`, which renders ngx-datatable's native checkbox.
 */
@Component({
  selector: 'ang-table-checkbox-header-cell-definition',
  imports: [EventScope, HeaderCellTemplateContext, MatCheckbox, TrackChange],
  template: `
    <ng-template let-allRowsSelected="allRowsSelected" let-selectFn="selectFn" angHeaderCellTemplateContext>
      <div class="ang-table--checkbox-header">
        <mat-checkbox
          angEventScope="select-all"
          angTrackChange
          [aria-label]="config?.label ?? 'Select all rows'"
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
export class CheckboxHeaderCellDefinition extends HeaderCellDefinition<CheckboxHeaderCellConfig | undefined> {
  /** Whether the table currently has both rows and a non-empty selection. */
  protected readonly someRowsSelected = computed(() => {
    if (this.table.selected().length === 0) {
      return false;
    }

    return (this.table.rows()?.length ?? 0) !== 0;
  });
}
