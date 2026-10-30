import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  input,
  model,
  numberAttribute,
  output,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { EndOfResultsIndicator } from '@atlasng/design-system/indicators/end-of-results-indicator';
import { NoResultsIndicator } from '@atlasng/design-system/indicators/no-results-indicator';
import { ResultsIndicator } from '@atlasng/design-system/indicators/results-indicator';
import { ScrollArea } from '@atlasng/design-system/scroll-area';
import { Table, type Row, type SortPropDir, type TableColumn } from '@atlasng/design-system/table';
import { KgExplorerTableEndSlot } from '../slots';

/** Default height of the spacious explorer table rows in pixels. */
export const KG_EXPLORER_ROW_HEIGHT = 96;

/** Maximum number of autocomplete suggestions shown below the search field. */
const MAX_SUGGESTIONS = 8;

/**
 * Matches a row when any of its primitive or array values contains the search term.
 *
 * @param row Row to test.
 * @param term Lowercase, trimmed search term.
 * @returns Whether the row matches.
 */
export function defaultKgExplorerSearch(row: Row, term: string): boolean {
  return Object.values(row).some((value) => {
    const values: unknown[] = Array.isArray(value) ? value : [value];
    return values.some(
      (item) => (typeof item === 'string' || typeof item === 'number') && String(item).toLowerCase().includes(term),
    );
  });
}

/**
 * Searchable, sortable results table of the knowledge graph explorer with a
 * search bar, results counter, and end-of-results indicator. It fills its
 * container's height; the table, indicator, and table end content scroll
 * below the search bar.
 *
 * Project an `<ng-template angKgExplorerTableEnd>`, or pass `tableEndTemplate`,
 * to add content such as a footer at the end of the table.
 */
@Component({
  selector: 'ang-kg-explorer-results-table',
  imports: [
    EndOfResultsIndicator,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatOption,
    MatPrefix,
    MatSuffix,
    NoResultsIndicator,
    ResultsIndicator,
    ScrollArea,
    Table,
    NgTemplateOutlet,
  ],
  templateUrl: './results-table.html',
  styleUrl: './results-table.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-kg-explorer-results-table',
  },
})
export class KgExplorerResultsTable<TRow extends Row = Row> {
  /** All rows available to the table before searching. */
  readonly rows = input.required<TRow[]>();

  /** Column definitions displayed by the table. Reuse the array between changes. */
  readonly columns = input.required<TableColumn<TRow>[]>();

  /** Height of each table row in pixels. */
  readonly rowHeight = input(KG_EXPLORER_ROW_HEIGHT, { transform: numberAttribute });

  /** Current search term. */
  readonly search = model('');

  /** Currently applied column sorts. */
  readonly sorts = model<SortPropDir[]>([]);

  /**
   * Decides whether a row matches the lowercase, trimmed search term.
   * Defaults to {@link defaultKgExplorerSearch}.
   */
  readonly searchFn = input<(row: TRow, term: string) => boolean>(defaultKgExplorerSearch);

  /** Derives the autocomplete suggestion for a row; omit to disable suggestions. */
  readonly searchLabelFn = input<(row: TRow) => string>();

  /** Label of the search field. */
  readonly searchLabel = input('Search');

  /** Shows the search field. */
  readonly showSearch = input(true, { transform: booleanAttribute });

  /** Shows the "Viewing X of Y" results counter. */
  readonly showResultsCounter = input(true, { transform: booleanAttribute });

  /** Shows the end-of-results indicator below the table. */
  readonly showEndOfResults = input(true, { transform: booleanAttribute });

  /** Emits when the user clears the results from the no-results indicator. */
  readonly clearResults = output<void>();

  /** Template rendered at the end of the table; takes precedence over projected content. */
  readonly tableEndTemplate = input<TemplateRef<unknown>>();

  /** Projected template rendered at the end of the table. */
  protected readonly tableEndSlot = contentChild(KgExplorerTableEndSlot);

  /** Content rendered at the end of the table, if any. */
  protected readonly tableEnd = computed(() => this.tableEndTemplate() ?? this.tableEndSlot()?.template);

  /** Normalized search term. */
  protected readonly term = computed(() => this.search().trim().toLowerCase());

  /** Rows matching the current search term. */
  protected readonly filteredRows = computed(() => {
    const term = this.term();
    const rows = this.rows();
    if (!term) {
      return rows;
    }

    const searchFn = this.searchFn();
    return rows.filter((row) => searchFn(row, term));
  });

  /** Unique autocomplete suggestions for the current search term. */
  protected readonly suggestions = computed(() => {
    const labelFn = this.searchLabelFn();
    const term = this.term();
    if (!labelFn || !term) {
      return [];
    }

    const labels = this.rows()
      .map(labelFn)
      .filter((label) => label.toLowerCase().includes(term));
    return [...new Set(labels)].slice(0, MAX_SUGGESTIONS);
  });

  /** Clears the search term and notifies listeners. */
  protected clear(): void {
    this.search.set('');
    this.clearResults.emit();
  }
}
