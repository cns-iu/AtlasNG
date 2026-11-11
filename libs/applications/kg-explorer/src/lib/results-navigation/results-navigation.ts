import { booleanAttribute, Component, input, model, ViewEncapsulation } from '@angular/core';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { ResultsIndicator } from '@atlasng/design-system/indicators/results-indicator';

/**
 * Navigation bar above the knowledge graph explorer results: a search field
 * with optional autocomplete suggestions and a "Viewing X of Y" results counter.
 *
 * It only displays state; the parent filters the rows and computes the suggestions.
 */
@Component({
  selector: 'ang-kg-explorer-results-navigation',
  imports: [
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
    ResultsIndicator,
  ],
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

  /** Autocomplete suggestions for the current search term. */
  readonly suggestions = input<readonly string[]>([]);

  /** Disables the autocomplete panel, for example when no suggestions can be derived. */
  readonly suggestionsDisabled = input(false, { transform: booleanAttribute });

  /** Number of results currently shown. */
  readonly count = input(0);

  /** Total number of results before searching. */
  readonly total = input(0);

  /** Disables the search field. */
  readonly searchDisabled = input(false, { transform: booleanAttribute });

  /** Disables the "Viewing X of Y" results counter. */
  readonly resultsCounterDisabled = input(false, { transform: booleanAttribute });
}
