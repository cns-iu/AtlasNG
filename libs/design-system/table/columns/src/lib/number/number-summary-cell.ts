import { formatNumber } from '@angular/common';
import { Component, inject, LOCALE_ID, numberAttribute, Pipe, PipeTransform, ViewEncapsulation } from '@angular/core';
import {
  type CellContext,
  type Row,
  SummaryCellDefinition,
  SummaryCellTemplateContext,
} from '@atlasng/design-system/table';

/**
 * Configuration for the default sum of {@link NumberSummaryCellDefinition}.
 * Empty cells (`null`, `undefined`, and `''`) are always skipped. Ignored when the
 * column supplies its own `summaryFunc`.
 */
export interface NumberSummaryCellConfig {
  /**
   * Coerces non-number cells with `numberAttribute`, so numeric strings are summed.
   * Cells that cannot be coerced become `NaN` and follow {@link nonFinite}. When
   * false, non-number cells are skipped. Defaults to false.
   */
  coerce?: boolean;
  /**
   * Whether `NaN` and `±Infinity` values are skipped or included, in which case
   * the sum becomes non-finite. Defaults to `'skip'`.
   */
  nonFinite?: 'skip' | 'include';
}

/**
 * Computes a column summary from the table rows.
 *
 * ngx-datatable skips `summaryFunc` for columns with a summary template, so this
 * pipe applies it instead, falling back to a numeric sum when none is configured,
 * and formats the result for the active locale.
 */
@Pipe({ name: 'angTableNumberSummary' })
class NumberSummaryPipe implements PipeTransform {
  /** Locale used to format numeric summaries. */
  readonly #locale = inject(LOCALE_ID);

  /**
   * Summarizes one column of the supplied rows.
   *
   * @param rows Rows displayed by the table.
   * @param column Column whose `prop` and `summaryFunc` drive the summary.
   * @param config Configuration for the default sum; undefined applies the defaults.
   * @returns Formatted summary, or null when the column disables summaries or has no summary value.
   */
  transform(
    rows: readonly Row[] | null | undefined,
    column: CellContext['column'],
    config: NumberSummaryCellConfig | undefined,
  ): string | null {
    const { prop, summaryFunc = (cells) => this.#sumCells(cells, config ?? {}) } = column;
    if (prop === undefined || summaryFunc === null) {
      return null;
    }

    const cells = (rows ?? []).map((row) => row[prop]);
    const summary = summaryFunc(cells);
    return this.#formatSummary(summary);
  }

  /**
   * Sums a column's cells according to the summary configuration.
   *
   * Empty cells are always skipped, non-number cells are skipped unless coerced,
   * and non-finite values are skipped unless `nonFinite` is `'include'`.
   *
   * @param cells Column values gathered from every table row.
   * @param config Coercion and non-finite handling options.
   * @returns Sum of the included cells, or null when no cell is included.
   */
  #sumCells(cells: unknown[], config: NumberSummaryCellConfig): number | null {
    const { coerce = false, nonFinite = 'skip' } = config;
    let total = 0;
    let hasValues = false;

    for (const cell of cells) {
      if (cell === null || cell === undefined || cell === '') {
        continue;
      } else if (typeof cell !== 'number' && !coerce) {
        continue;
      }

      const value = typeof cell === 'number' ? cell : numberAttribute(cell);
      if (nonFinite === 'skip' && !Number.isFinite(value)) {
        continue;
      }

      hasValues = true;
      total += value;
    }

    return hasValues ? total : null;
  }

  /**
   * Formats a summary value for display.
   *
   * Numbers and numeric strings are formatted for the active locale, including the
   * locale's `NaN` and infinity symbols. Other strings are returned unchanged.
   *
   * @param summary Value produced by the default sum or the column's `summaryFunc`.
   * @returns Display text, or null for values that are neither numbers nor strings.
   */
  #formatSummary(summary: unknown): string | null {
    if (typeof summary === 'string') {
      const coerced = numberAttribute(summary);
      if (Number.isNaN(coerced)) {
        return summary;
      }

      summary = coerced;
    }

    if (typeof summary === 'number') {
      return formatNumber(summary, this.#locale);
    }

    return null;
  }
}

/**
 * Reusable localized, end-aligned number summary cell.
 *
 * Sums the column's numeric values by default, configured through
 * {@link NumberSummaryCellConfig}. A column `summaryFunc` replaces the sum: numbers
 * and numeric strings are formatted for the active locale, other strings are shown
 * unchanged, and any other value leaves the cell empty. A `null` `summaryFunc`
 * disables the summary.
 */
@Component({
  selector: 'ang-table-number-summary-cell-definition',
  imports: [NumberSummaryPipe, SummaryCellTemplateContext],
  template: `
    <ng-template let-column="column" angSummaryCellTemplateContext>
      <span class="ang-table--number-cell">{{ table.rows() | angTableNumberSummary: column : config }}</span>
    </ng-template>
  `,
  styleUrl: './number-cell.scss',
  encapsulation: ViewEncapsulation.None,
})
export class NumberSummaryCellDefinition extends SummaryCellDefinition<NumberSummaryCellConfig> {}
