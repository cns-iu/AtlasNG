import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, MatListOption } from '@angular/material/list';
/** Search list option interface */
export interface SearchListOption {
  /** Option id */
  id: string;
  /** Option label */
  label: string;
  /** Secondary label */
  description?: string;
  description2?: string;
  /** Number of results for the filter option in the data */
  count?: number;
}

@Component({
  selector: 'ang-search-list',
  imports: [FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatListModule],
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

  /** Whether to disable the ripple effect for list items */
  readonly disableRipple = input(false, { transform: booleanAttribute });

  /** All filter options */
  readonly options = input.required<T[]>();

  /** Currently selected filters */
  readonly selected = model<T[]>([]);

  /** Current search bar value */
  readonly search = model<string>('');

  /** Filtered options (after typing in search bar) */
  readonly filteredOptions = computed(() => this.doSearch());

  /**
   * Updates selected options on update
   * @param event Selected options in list
   */
  selectionUpdate(event: MatListOption[]): void {
    this.selected.set(event.map((option) => option.value));
  }

  /** Filters options according to the search bar value */
  private doSearch(): T[] {
    const searchTerm = this.search().toLowerCase();
    return this.options().filter((option) => option.label.toLowerCase().includes(searchTerm));
  }
}
