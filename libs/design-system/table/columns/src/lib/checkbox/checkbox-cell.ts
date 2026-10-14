import { Component, ViewEncapsulation } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { CellDefinition, CellTemplateContext, type Row } from '@atlasng/design-system/table';
import { RequireOneOrNone, Simplify } from 'type-fest';

/**
 * Optional, mutually exclusive strategies for naming each row checkbox.
 */
export type CheckboxCellConfig<TRow extends Row = Row> = Simplify<
  RequireOneOrNone<
    {
      /** Function that derives a row label, announced as "Select <label>". */
      labelFn: (row: TRow) => string;
      /** Row property whose string value is announced as "Select <value>". */
      labelProp: keyof TRow;
    },
    'labelFn' | 'labelProp'
  >
>;

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
  /** Label accessor selected from the mutually exclusive configuration strategy. */
  protected readonly getLabel = this.#createLabelAccessor();

  /**
   * Creates the configured label accessor once for this definition instance.
   *
   * @returns Function that derives a checkbox label from a row and its zero-based index,
   * falling back to the one-based row number or "Select row".
   */
  #createLabelAccessor(): (row: TRow, rowIndex: number | undefined) => string {
    const { labelFn, labelProp } = this.config ?? {};
    if (labelFn !== undefined) {
      return (row: TRow) => `Select ${labelFn(row)}`;
    } else if (labelProp !== undefined) {
      return (row: TRow) => `Select ${String(row[labelProp] ?? '')}`;
    }

    return (_row: TRow, rowIndex: number | undefined) =>
      typeof rowIndex === 'number' ? `Select row ${rowIndex + 1}` : 'Select row';
  }
}
