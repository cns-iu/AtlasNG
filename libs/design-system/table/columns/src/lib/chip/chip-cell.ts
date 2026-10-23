import { Component, ViewEncapsulation } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { CellDefinition, CellTemplateContext, type Row } from '@atlasng/design-system/table';

/**
 * Normalizes a cell value into the list of chip labels to render.
 * Arrays render one chip per item, other values render a single chip,
 * and `null`, `undefined`, and empty strings are skipped.
 *
 * @param value Cell value to normalize.
 * @returns Chip labels in display order.
 */
export function toChipLabels(value: unknown): string[] {
  const items: unknown[] = Array.isArray(value) ? value : [value];
  return items.filter((item) => item !== null && item !== undefined && item !== '').map(String);
}

/**
 * Reusable start-aligned body cell that renders its value as a wrapping list
 * of stateless Material chips, typically used to display data tags.
 * Array values render one chip per item; any other value renders a single chip.
 *
 * Empty values render nothing. Chip colors, typography, and shape are customized
 * with the `chip-cell-*` tokens of the `table-overrides` mixin.
 */
@Component({
  selector: 'ang-table-chip-cell-definition',
  imports: [CellTemplateContext, MatChipsModule],
  template: `
    <ng-template let-value="value" [angCellTemplateContext]="rowType">
      @let values = toChipLabels(value);
      @if (values.length > 0) {
        <mat-chip-set class="ang-table--chip-cell" role="list">
          @for (label of values; track $index) {
            <mat-chip class="ang-table--chip-cell-item" role="listitem" disableRipple>{{ label }}</mat-chip>
          }
        </mat-chip-set>
      }
    </ng-template>
  `,
  styleUrl: './chip-cell.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ChipCellDefinition<TRow extends Row = Row> extends CellDefinition<TRow> {
  /** Converts the cell value into chip labels. */
  protected readonly toChipLabels = toChipLabels;
}
