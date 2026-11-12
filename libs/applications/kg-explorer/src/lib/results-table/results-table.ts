import { booleanAttribute, Component, computed, inject, input, model, output, ViewEncapsulation } from '@angular/core';
import { EndOfResultsIndicator } from '@atlasng/design-system/indicators/end-of-results-indicator';
import { NoResultsIndicator } from '@atlasng/design-system/indicators/no-results-indicator';
import { ScrollArea } from '@atlasng/design-system/scroll-area';
import { Table, type Row, type SortPropDir, type TableColumn } from '@atlasng/design-system/table';
import { KG_EXPLORER_CONFIG } from '../config';
import { KgExplorerResultsNavigation } from '../results-navigation/results-navigation';

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
 * Projected content, such as a footer, is rendered at the end of the table.
 */
@Component({
  selector: 'ang-kg-explorer-results-table',
  imports: [EndOfResultsIndicator, KgExplorerResultsNavigation, NoResultsIndicator, ScrollArea, Table],
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

  /** Disables the search field. */
  readonly searchDisabled = input(false, { transform: booleanAttribute });

  /** Disables the "Viewing X of Y" results counter. */
  readonly resultsCounterDisabled = input(false, { transform: booleanAttribute });

  /** Disables the end-of-results indicator below the table. */
  readonly endOfResultsDisabled = input(false, { transform: booleanAttribute });

  /** Emits when the user clears the results from the no-results indicator. */
  readonly clearResults = output<void>();

  /** Explorer configuration. */
  private readonly config = inject(KG_EXPLORER_CONFIG);

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
    return [...new Set(labels)].slice(0, this.config.maxSuggestions);
  });

  /** Clears the search term and notifies listeners. */
  protected clear(): void {
    this.search.set('');
    this.clearResults.emit();
  }
}
