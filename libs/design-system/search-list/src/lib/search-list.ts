import { DecimalPipe } from '@angular/common';
import { booleanAttribute, Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { injectSearch, SearchFieldDefinition, SearchHighlight, SearchRange } from '@atlasng/cdk/search';

/** Name of the search field holding the option label */
const LABEL_FIELD = 'label';

/** Name of the search field holding the option description lines */
const DESCRIPTION_FIELD = 'description';

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
 * Options are filtered with the injected `SEARCH_ENGINE` and `SEARCH_CONFIG`,
 * so consumers can swap the engine with `provideSearch`. Matching options keep
 * their original order and matched text is highlighted.
 *
 * Selections are matched by option object identity and are kept while the
 * search filter hides the selected options.
 */
@Component({
  selector: 'ang-search-list',
  imports: [DecimalPipe, FormsModule, MatIconModule, MatInputModule, MatListModule, SearchHighlight],
  templateUrl: './search-list.html',
  styleUrl: './search-list.scss',
  host: {
    class: 'ang-search-list',
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
  readonly searchDisabled = input(false, { transform: booleanAttribute });

  /** Fields searched by the engine: the label and each description line */
  readonly #searchFields: SearchFieldDefinition<T>[] = [
    { name: LABEL_FIELD, get: (option) => option.label },
    { name: DESCRIPTION_FIELD, get: (option) => this.normalizeDescription(option.description) },
  ];

  /** Search over the options with the injected engine and configuration */
  readonly #search = injectSearch({ items: this.options, term: this.search, fields: this.#searchFields });

  /** Matches of each option in the current search results, keyed by option */
  readonly #matches = computed(
    () => new Map(this.#search.results().map((result) => [result.item, result.matches ?? []] as const)),
  );

  /** Options matching the search term, in their original order */
  protected readonly filteredOptions = computed(() => {
    const matches = this.#matches();
    return this.options().filter((option) => matches.has(option));
  });

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
   * Gets the ranges of an option label that matched the search term
   * @param option Option to look up
   * @returns Matched ranges, or undefined when the label did not match
   */
  protected getLabelRanges(option: T): readonly SearchRange[] | undefined {
    return this.#getMatchRanges(option, LABEL_FIELD, option.label);
  }

  /**
   * Gets the ranges of an option description line that matched the search term
   * @param option Option to look up
   * @param line Description line of the option
   * @returns Matched ranges, or undefined when the line did not match
   */
  protected getDescriptionRanges(option: T, line: string): readonly SearchRange[] | undefined {
    return this.#getMatchRanges(option, DESCRIPTION_FIELD, line);
  }

  /**
   * Gets the ranges of an option's field value that matched the search term.
   * Identical values of the same field share their ranges.
   * @param option Option to look up
   * @param field Name of the matched field
   * @param value Field value the ranges index into
   * @returns Matched ranges, or undefined when the value did not match
   */
  #getMatchRanges(option: T, field: string, value: string): readonly SearchRange[] | undefined {
    return this.#matches()
      .get(option)
      ?.find((match) => match.field === field && match.value === value)?.ranges;
  }
}
