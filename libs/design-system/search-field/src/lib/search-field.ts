import { booleanAttribute, Component, computed, ElementRef, input, model, output, viewChild } from '@angular/core';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { injectSearch, SearchHighlight, type SearchFieldSpec, type SearchSuggestion } from '@atlasng/cdk/search';

/**
 * Search input with a search icon, a clear button, and autocomplete suggestions whose matched text is highlighted.
 *
 * Suggestions come from `suggestions` when it is set, for example from a remote service, and otherwise from the
 * values of `suggestionField` in `items`, searched with the injected `SEARCH_ENGINE`. Provide
 * `provideSearch(withCustomEngine(...))` in a parent or in the component providers to swap the engine.
 *
 * Escape clears the term and closes the suggestions. The arrow keys and Enter select suggestions.
 */
@Component({
  selector: 'ang-search-field',
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
    SearchHighlight,
  ],
  templateUrl: './search-field.html',
  styleUrl: './search-field.scss',
  host: {
    class: 'ang-search-field',
  },
})
export class SearchField<T = string> {
  /** Items whose `suggestionField` values are suggested. Ignored when `suggestions` is set. */
  readonly items = input<readonly T[]>();

  /** Field of `items` to suggest. Defaults to the items themselves when they are strings or numbers. */
  readonly suggestionField = input<SearchFieldSpec<T>>();

  /**
   * Suggestions to show as they are, for example from a remote service. Takes precedence over `items`. Suggestions
   * with ranges, such as those returned by `SearchIndex.suggest`, are highlighted; plain strings are not.
   */
  readonly suggestions = input<readonly (string | SearchSuggestion)[]>();

  /** Label of the search field. */
  readonly label = input('Search');

  /** Placeholder of the search input. */
  readonly placeholder = input<string>();

  /** Disables the search field. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Milliseconds to wait after typing stops before suggesting from `items`. Defaults to the configured search
   * `debounce`.
   */
  readonly debounce = input<number>();

  /** Search term. */
  readonly value = model('');

  /** Emits the suggestion the user selected. */
  readonly suggestionSelected = output<string>();

  /** Emits when the user clears the term with the clear button or Escape. */
  readonly cleared = output<void>();

  /** Search input element. */
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  /** Autocomplete trigger of the search input. */
  private readonly trigger = viewChild.required(MatAutocompleteTrigger);

  /** Suggestions computed from the items. */
  readonly #search = injectSearch<T>({
    items: computed(() => (this.suggestions() ? [] : (this.items() ?? []))),
    term: this.value,
    suggestionField: this.suggestionField,
    debounce: this.debounce,
  });

  /** Displayed suggestions with the ranges to highlight. */
  protected readonly options = computed(
    (): readonly SearchSuggestion[] =>
      this.suggestions()?.map((suggestion) =>
        typeof suggestion === 'string' ? { value: suggestion, ranges: [] } : suggestion,
      ) ?? this.#search.suggestions(),
  );

  /**
   * Updates the term from the input.
   *
   * @param event Input event of the search input.
   */
  protected updateValue(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  /**
   * Applies a selected suggestion.
   *
   * @param suggestion Selected suggestion.
   */
  protected select(suggestion: string): void {
    this.value.set(suggestion);
    this.suggestionSelected.emit(suggestion);
  }

  /** Clears the term from the clear button and moves focus back to the input. */
  protected clear(): void {
    this.#clear();
    this.input().nativeElement.focus();
  }

  /** Clears the term, if any, and closes the suggestions. */
  protected handleEscape(): void {
    if (this.value()) {
      this.#clear();
    }
    this.trigger().closePanel();
  }

  /** Clears the term and notifies listeners. */
  #clear(): void {
    this.value.set('');
    this.cleared.emit();
  }
}
