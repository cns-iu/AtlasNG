import { booleanAttribute, Component, computed, input, model, output, ViewEncapsulation } from '@angular/core';
import { injectSearch, type SearchFieldSpec } from '@atlasng/cdk/search';
import { EndOfResultsIndicator } from '@atlasng/design-system/indicators/end-of-results-indicator';
import { NoResultsIndicator } from '@atlasng/design-system/indicators/no-results-indicator';
import { ScrollArea } from '@atlasng/design-system/scroll-area';
import { Table, type Row, type SortPropDir, type TableColumn } from '@atlasng/design-system/table';
import { KgExplorerResultsNavigation } from '../results-navigation/results-navigation';

/**
 * Searchable, sortable results table of the knowledge graph explorer with a
 * search bar, results counter, and end-of-results indicator. It fills its
 * container's height; the table, indicator, and table end content scroll
 * below the search bar.
 *
 * Rows are searched with the injected `SearchEngine` and `SEARCH_CONFIG`, so
 * consumers can swap the engine or change the suggestion limit with `provideSearch`.
 * Matching rows keep the order of `rows`.
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

  /** Fields to search. Defaults to every string, number, and array of strings or numbers of a row. */
  readonly searchFields = input<readonly SearchFieldSpec<TRow>[]>();

  /** Field whose values are suggested below the search field; omit to disable suggestions. */
  readonly searchSuggestionField = input<SearchFieldSpec<TRow>>();

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

  /** Search over the rows, in their original order. */
  readonly #search = injectSearch<TRow>({
    items: this.rows,
    term: this.search,
    fields: this.searchFields,
    suggestionField: this.searchSuggestionField,
    order: 'source',
  });

  /** Rows matching the current search term; empty if an asynchronous engine fails. */
  protected readonly results = computed(() => [...this.#search.items()]);

  /** Autocomplete suggestions for the current search term; empty if an asynchronous engine fails. */
  protected readonly suggestions = computed(() => {
    const { suggestions } = this.#search;
    return suggestions.hasValue() ? suggestions.value() : [];
  });

  /** Clears the search term and notifies listeners. */
  protected clear(): void {
    this.search.set('');
    this.clearResults.emit();
  }
}
