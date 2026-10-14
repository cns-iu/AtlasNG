import { Component, ViewEncapsulation } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { CellDefinition, CellTemplateContext, type Row } from '@atlasng/design-system/table';

/**
 * Optional strategies for naming each row checkbox.
 * When both are set, `labelFn` takes precedence over `labelProp`.
 */
export interface CheckboxCellConfig<TRow extends Row = Row> {
  /** Function that derives a row label, announced as "Select <label>". */
  labelFn?: (row: TRow) => string;
  /** Row property whose string value is announced as "Select <value>". */
  labelProp?: keyof TRow;
}

/**
 * Reusable Material checkbox body-cell definition.
 *
 * Configure it as a column's `cellTemplate`; do not also enable ngx-datatable's
 * `checkboxable` flag because that flag renders a second native checkbox.
 *
 * Each checkbox is named from the optional {@link CheckboxCellConfig}, or by its
 * one-based row number ("Select row 3") so screen-reader users can tell rows apart.
 */
@Component({
  selector: 'ang-table-checkbox-cell-definition',
  imports: [CellTemplateContext, MatCheckbox],
  template: `
    <ng-template
      let-disabled="disabled"
      let-isSelected="isSelected"
      let-onCheckboxChangeFn="onCheckboxChangeFn"
      let-row="row"
      let-rowIndex="rowIndex"
      [angCellTemplateContext]="rowType"
    >
      <div class="ang-table--checkbox-cell">
        <mat-checkbox
          [aria-label]="getLabel(row, rowIndex)"
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
export class CheckboxCellDefinition<TRow extends Row = Row> extends CellDefinition<
  TRow,
  CheckboxCellConfig<TRow> | undefined
> {
  /**
   * Builds the accessible name of a row checkbox.
   *
   * @param row Row rendered in the cell.
   * @param rowIndex Zero-based index of the row, when known.
   * @returns Checkbox label, falling back to "Select row".
   */
  protected getLabel(row: TRow, rowIndex: number | undefined): string {
    const { labelFn, labelProp } = this.config ?? {};
    if (labelFn !== undefined) {
      return `Select ${labelFn(row)}`;
    } else if (labelProp !== undefined) {
      return `Select ${String(row[labelProp] ?? '')}`;
    } else if (typeof rowIndex === 'number') {
      return `Select row ${rowIndex + 1}`;
    }

    return 'Select row';
  }
}
