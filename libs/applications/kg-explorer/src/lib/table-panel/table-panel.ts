import { Component, computed, input, model, output, ViewEncapsulation } from '@angular/core';
import { injectSearch } from '@atlasng/cdk/search';
import { EndOfResultsIndicator } from '@atlasng/design-system/indicators/end-of-results-indicator';
import { NoResultsIndicator } from '@atlasng/design-system/indicators/no-results-indicator';
import { ScrollArea } from '@atlasng/design-system/scroll-area';
import { Table, type Row, type SortPropDir, type TableColumn } from '@atlasng/design-system/table';
import type { KgExplorerTableViewConfig } from '../config';
import { KgExplorerTableToolbar } from '../table-toolbar/table-toolbar';

/**
 * Searchable, sortable results table of the knowledge graph explorer with a
 * search bar, results counter, and end-of-results indicator. It fills its
 * container's height; the table, indicator, and table end content scroll
 * below the search bar.
 *
 * Rows are searched with the injected `SearchEngine` and `SEARCH_CONFIG`, so
 * consumers can swap the engine or change the suggestion limit with `provideSearch`.
 * Matching rows keep the order of `rows`. `rowFilter` is applied by the search, so
 * changing it does not rebuild the search index and suggestions only come from
 * rows that pass it.
 *
 * Projected content, such as a footer, is rendered at the end of the table.
 */
@Component({
  selector: 'ang-kg-explorer-table-panel',
  imports: [EndOfResultsIndicator, KgExplorerTableToolbar, NoResultsIndicator, ScrollArea, Table],
  templateUrl: './table-panel.html',
  styleUrl: './table-panel.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-kg-explorer-table-panel',
  },
})
export class KgExplorerTablePanel<TRow extends Row = Row> {
  /** All rows available to the table before searching. */
  readonly rows = input.required<TRow[]>();

  /** Column definitions displayed by the table. Reuse the array between changes. */
  readonly columns = input.required<TableColumn<TRow>[]>();

  /** Current search term. */
  readonly search = model('');

  /** Currently applied column sorts. */
  readonly sorts = model<SortPropDir[]>([]);

  /** Resolved table view configuration: search fields, suggestions, and which parts are shown. */
  readonly config = input.required<KgExplorerTableViewConfig<TRow>>();

  /** Decides which rows can be shown, for example from filter selections. Reuse the function while it is unchanged. */
  readonly rowFilter = input<(row: TRow) => boolean>();

  /** Emits when the user clears the results from the no-results indicator. */
  readonly clearResults = output<void>();

  /** Search over the rows, in their original order. */
  readonly #search = injectSearch<TRow>({
    items: this.rows,
    term: this.search,
    fields: () => this.config().searchFields,
    filter: this.rowFilter,
    suggestionField: () => {
      const { searchSuggestionField, searchSuggestionsDisabled } = this.config();
      return searchSuggestionsDisabled ? undefined : searchSuggestionField;
    },
    order: 'source',
  });

  /** Rows matching the current search term and row filter; empty if an asynchronous engine fails. */
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
