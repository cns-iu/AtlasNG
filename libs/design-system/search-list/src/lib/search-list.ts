import { DecimalPipe } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, MatListOption } from '@angular/material/list';

/** Search list option interface */
export interface SearchListOption {
  /** Option label */
  label: string;
  /** Description */
  description?: string | string[];
  /** Number of results for the filter option in the data */
  count?: number;
}

@Component({
  selector: 'ang-search-list',
  imports: [DecimalPipe, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatListModule],
  templateUrl: './search-list.html',
  styleUrl: './search-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ang-search-list',
  },
})
export class SearchList<T extends SearchListOption> {
  /** Whether to hide the autocomplete search bar */
  readonly disableSearch = input(false, { transform: booleanAttribute });

  /** All filter options */
  readonly options = input.required<T[]>();

  /** Currently selected filters */
  readonly selected = model<T[]>([]);

  /** Current search bar value */
  readonly search = model<string>('');

  /** Filtered options (after typing in search bar) */
  protected readonly filteredOptions = computed(() => this.#getFilteredOptions());

  /** Filters options according to the search bar value */
  #getFilteredOptions(): T[] {
    const searchTerm = this.search().toLowerCase().trim();
    if (searchTerm === '') {
      return this.options();
    }
    return this.options().filter(
      (option) =>
        option.label.toLowerCase().includes(searchTerm) ||
        this.descriptionLines(option.description).some((line) => line.toLowerCase().includes(searchTerm)),
    );
  }

  /**
   * Updates selected options on update
   * @param event Selected options in list
   */
  selectionUpdate(event: MatListOption[]): void {
    this.selected.set(event.map((option) => option.value));
  }

  /**
   * Normalizes an option description into the lines to display
   * @param description Single description or list of descriptions
   * @returns Description lines, empty when there is no description
   */
  protected descriptionLines(description: SearchListOption['description']): string[] {
    if (Array.isArray(description)) {
      return description;
    }
    return description ? [description] : [];
  }
}
