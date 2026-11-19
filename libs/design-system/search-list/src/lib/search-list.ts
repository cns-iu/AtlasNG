import { DecimalPipe } from '@angular/common';
import { booleanAttribute, Component, computed, input, model, viewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { provideEventScope, TrackChange, TrackClick } from '@atlasng/analytics';
import { Announce } from '@atlasng/cdk/a11y';
import { injectSearch, SearchHighlight, SearchRange, SearchResult } from '@atlasng/cdk/search';
import { ScrollArea } from '@atlasng/design-system/scroll-area';

/** Search list option interface */
export interface SearchListOption {
  /** Option label */
  label: string;
  /** Description */
  description?: string | string[];
  /** Number of results for the filter option in the data */
  count?: number;
}

/**
 * Searchable multi-select list of options, each showing a label, an optional
 * result count and optional description lines.
 *
 * Options are filtered with the injected `SearchEngine` and `SEARCH_CONFIG`,
 * so consumers can swap the engine with `provideSearch`. Matching options keep
 * their original order and matched text is highlighted.
 *
 * When the search term matches no options, a message naming the term takes
 * their place, with a Clear search button that empties the field. Screen
 * readers announce the message once the term stops changing.
 *
 * Selections are matched by option object identity and are kept while the
 * search filter hides the selected options.
 *
 * The options scroll in an `ang-scroll-area` below the search field. Constrain
 * the height of the host so that the options can scroll.
 */
@Component({
  selector: 'ang-search-list',
  imports: [
    Announce,
    DecimalPipe,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    ScrollArea,
    SearchHighlight,
    TrackChange,
    TrackClick,
  ],
  templateUrl: './search-list.html',
  styleUrl: './search-list.scss',
  providers: [provideEventScope('search-list')],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-search-list',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
  },
})
export class SearchList<T extends SearchListOption> {
  /** All filter options */
  readonly options = input.required<T[]>();

  /** Currently selected filters */
  readonly selected = model<T[]>([]);

  /** Current search bar value */
  readonly search = model<string>('');

  /** Whether to hide the search field */
  readonly disableSearch = input(false, { transform: booleanAttribute });

  /** Label of the search field */
  readonly searchLabel = input('Search');

  /** Text shown before the quoted search term when it matches no options */
  readonly noResultsLabel = input('No options match');

  /** Label of the button that empties the search field when the term matches no options */
  readonly clearSearchLabel = input('Clear search');

  /** Accessible name of the option list, such as the name of the filter it belongs to */
  readonly ariaLabel = input<string | null>('Options', { alias: 'aria-label' });

  /** Space-separated ids of elements labelling the option list. Takes precedence over `aria-label`. */
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });

  /** Search over the options, in their original order */
  readonly #search = injectSearch({
    items: this.options,
    term: this.search,
    fields: ['label', 'description'],
    order: 'source',
  });

  /** Options matching the search term with their matches; empty if an asynchronous engine fails */
  protected readonly results = computed(() => (this.#search.hasValue() ? this.#search.value() : []));

  /** Search term without surrounding whitespace */
  readonly #term = computed(() => this.search().trim());

  /** Whether the search finished and the term matches no options. False while an asynchronous engine fails. */
  protected readonly noResults = computed(
    () => this.#term() !== '' && this.#search.hasValue() && !this.#search.isLoading() && this.results().length === 0,
  );

  /** Message naming the search term that matches no options */
  protected readonly noResultsMessage = computed(() => `${this.noResultsLabel()} “${this.#term()}”`);

  /** Text for screen readers to announce: the no results message, or empty while options match */
  protected readonly announcement = computed(() => (this.noResults() ? this.noResultsMessage() : ''));

  /** Search field input, absent while search is disabled */
  private readonly searchInput = viewChild(MatInput);

  /**
   * Empties the search field to bring back every option, and moves focus to the
   * field because the Clear search button disappears with the message.
   */
  protected clearSearch(): void {
    this.search.set('');
    this.searchInput()?.focus();
  }

  /**
   * Merges the options toggled by the user into the current selection.
   * Selected options that are hidden by the search filter are kept.
   * @param event Selection change emitted by the selection list
   */
  protected updateSelection(event: MatSelectionListChange): void {
    this.selected.update((current) => {
      const selected = new Set(current);
      for (const option of event.options) {
        if (option.selected) {
          selected.add(option.value as T);
        } else {
          selected.delete(option.value as T);
        }
      }

      return [...selected];
    });
  }

  /**
   * Normalizes an option description into the lines to display
   * @param description Single description or list of descriptions
   * @returns Description lines, empty when there is no description
   */
  protected normalizeDescription(description: SearchListOption['description']): string[] {
    if (Array.isArray(description)) {
      return description;
    }
    return description ? [description] : [];
  }

  /**
   * Gets the ranges of an option field value that matched the search term
   * @param result Search result of the option
   * @param field Name of the matched field
   * @param index Position of the value among the description lines; `0` for single values
   * @returns Matched ranges, or undefined when the value did not match
   */
  protected getRanges(
    result: SearchResult<T>,
    field: 'label' | 'description',
    index = 0,
  ): readonly SearchRange[] | undefined {
    return result.matches?.find((match) => match.field === field && (match.index ?? 0) === index)?.ranges;
  }
}
