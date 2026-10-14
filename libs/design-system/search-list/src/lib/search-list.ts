import { DecimalPipe } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';

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
 * Selections are matched by option object identity and are kept while the
 * search filter hides the selected options.
 */
@Component({
  selector: 'ang-search-list',
  imports: [DecimalPipe, FormsModule, MatIconModule, MatInputModule, MatListModule],
  templateUrl: './search-list.html',
  styleUrl: './search-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  /** Filtered options (after typing in search bar) */
  protected readonly filteredOptions = computed(() => this.#getFilteredOptions());

  /**
   * Merges the options toggled by the user into the current selection.
   * Selected options that are hidden by the search filter are kept.
   * @param event Selection change emitted by the selection list
   */
  protected updateSelection(event: MatSelectionListChange): void {
    const added = new Set<T>();
    const removed = new Set<T>();
    for (const option of event.options) {
      (option.selected ? added : removed).add(option.value as T);
    }

    this.selected.update((current) => {
      const kept = current.filter((option) => !removed.has(option));
      const additions = [...added].filter((option) => !kept.includes(option));
      return [...kept, ...additions];
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
   * Filters options according to the search field value
   * @returns Options whose label or description matches the search term
   */
  #getFilteredOptions(): T[] {
    const searchTerm = this.search().toLowerCase().trim();
    if (searchTerm === '') {
      return this.options();
    }
    return this.options().filter((option) => this.#matchesSearch(option, searchTerm));
  }

  /**
   * Checks whether an option's label or description contains the search term
   * @param option Option to check
   * @param searchTerm Lowercased, trimmed search term
   * @returns True when the label or any description line matches
   */
  #matchesSearch(option: T, searchTerm: string): boolean {
    return (
      option.label.toLowerCase().includes(searchTerm) ||
      this.normalizeDescription(option.description).some((line) => line.toLowerCase().includes(searchTerm))
    );
  }
}
