import { DecimalPipe } from '@angular/common';
import { booleanAttribute, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { injectSearch, SearchHighlight, SearchRange, SearchResult } from '@atlasng/cdk/search';

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

  /** Options matching the search term, in their original order, with their matches */
  protected readonly results = injectSearch({
    items: this.options,
    term: this.search,
    fields: ['label', 'description'],
    order: 'source',
  }).results;

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
