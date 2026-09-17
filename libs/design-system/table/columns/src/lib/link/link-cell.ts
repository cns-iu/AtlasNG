import { Component, ViewEncapsulation } from '@angular/core';
import { AnyLink } from '@atlasng/common';
import { CellDefinition, CellTemplateContext, type Row } from '@atlasng/design-system/table';
import { TextLink } from '@atlasng/design-system/text-link';
import { RequireExactlyOne, Simplify } from 'type-fest';

/**
 * Supported mutually exclusive link-label strategies.
 */
export type LinkCellConfig<TRow extends Row = Row> = Simplify<
  RequireExactlyOne<
    {
      /** Static label rendered for every row. */
      label: string;
      /** Function that derives a label from the current row. */
      labelFn: (row: TRow) => string;
      /** Row property whose string value is used as the label. */
      labelProp: keyof TRow;
    },
    'label' | 'labelFn' | 'labelProp'
  >
>;

/**
 * Reusable link cell whose value is forwarded to {@link AnyLink}.
 */
@Component({
  selector: 'ang-table-link-cell-definition',
  imports: [AnyLink, CellTemplateContext, TextLink],
  template: `
    <ng-template let-row="row" let-value="value" [angCellTemplateContext]="rowType">
      <a angTextLink class="ang-table--link-cell" [angAnyLink]="value">{{ getLabel(row) }}</a>
    </ng-template>
  `,
  styleUrl: './link-cell.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LinkCellDefinition<TRow extends Row = Row> extends CellDefinition<TRow, LinkCellConfig<TRow>> {
  /** Label accessor selected from the mutually exclusive configuration strategy. */
  protected readonly getLabel = this.#createLabelAccessor();

  /**
   * Creates the configured label accessor once for this definition instance.
   *
   * @returns Function that derives a link label from a row.
   */
  #createLabelAccessor(): (row: TRow) => string {
    const { label = '', labelFn, labelProp } = this.config;
    if (labelFn !== undefined) {
      return labelFn;
    } else if (labelProp !== undefined) {
      return (row: TRow) => String(row[labelProp] ?? '');
    }

    return () => label;
  }
}
