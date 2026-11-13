import { Component, input, model, ViewEncapsulation } from '@angular/core';
import type { SearchSuggestion } from '@atlasng/cdk/search';
import { ResultsIndicator } from '@atlasng/design-system/indicators/results-indicator';
import { SearchField } from '@atlasng/design-system/search-field';
import type { KgExplorerTableViewConfig } from '../table-view/config';

/**
 * Toolbar above the knowledge graph explorer table: an `ang-search-field`
 * with optional autocomplete suggestions and a "Viewing X of Y" results counter.
 *
 * It only displays state; the parent filters the rows and computes the suggestions.
 */
@Component({
  selector: 'ang-kg-explorer-table-toolbar',
  imports: [ResultsIndicator, SearchField],
  templateUrl: './table-toolbar.html',
  styleUrl: './table-toolbar.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-kg-explorer-table-toolbar',
  },
})
export class KgExplorerTableToolbar {
  /** Current search term. */
  readonly search = model('');

  /** Autocomplete suggestions for the current search term; suggestions with ranges are highlighted. */
  readonly suggestions = input<readonly (string | SearchSuggestion)[]>([]);

  /** Number of results currently shown. */
  readonly count = input(0);

  /** Total number of results before searching. */
  readonly total = input(0);

  /** Table view configuration; `searchDisabled` and `resultsCounterDisabled` hide the parts of the toolbar. */
  readonly config = input<Pick<KgExplorerTableViewConfig, 'searchDisabled' | 'resultsCounterDisabled'>>({});
}
