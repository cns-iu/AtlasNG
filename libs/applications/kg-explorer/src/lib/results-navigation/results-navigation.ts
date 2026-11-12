import { booleanAttribute, Component, input, model, ViewEncapsulation } from '@angular/core';
import type { SearchSuggestion } from '@atlasng/cdk/search';
import { ResultsIndicator } from '@atlasng/design-system/indicators/results-indicator';
import { SearchField } from '@atlasng/design-system/search-field';

/**
 * Navigation bar above the knowledge graph explorer results: an `ang-search-field`
 * with optional autocomplete suggestions and a "Viewing X of Y" results counter.
 *
 * It only displays state; the parent filters the rows and computes the suggestions.
 */
@Component({
  selector: 'ang-kg-explorer-results-navigation',
  imports: [ResultsIndicator, SearchField],
  templateUrl: './results-navigation.html',
  styleUrl: './results-navigation.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-kg-explorer-results-navigation',
  },
})
export class KgExplorerResultsNavigation {
  /** Current search term. */
  readonly search = model('');

  /** Label of the search field. */
  readonly searchLabel = input('Search');

  /** Autocomplete suggestions for the current search term; suggestions with ranges are highlighted. */
  readonly suggestions = input<readonly (string | SearchSuggestion)[]>([]);

  /** Number of results currently shown. */
  readonly count = input(0);

  /** Total number of results before searching. */
  readonly total = input(0);

  /** Disables the search field. */
  readonly searchDisabled = input(false, { transform: booleanAttribute });

  /** Disables the "Viewing X of Y" results counter. */
  readonly resultsCounterDisabled = input(false, { transform: booleanAttribute });
}
