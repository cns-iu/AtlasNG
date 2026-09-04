import { booleanAttribute, Component, computed, input, model, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, MatListOption } from '@angular/material/list';

/** Describes an option displayed by the input select. */
export interface InputSelectOption {
  /** Option id */
  id: string;
  /** Option label */
  label: string;
  /** Secondary label */
  secondaryLabel?: string;
  /** Number of results for the filter option in the data */
  count?: number;
}

/** Provides a searchable, multi-select list of options. */
@Component({
  selector: 'ang-input-select',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatAutocompleteModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatListModule,
    MatCheckboxModule,
  ],
  templateUrl: './input-select.html',
  styleUrl: './input-select.scss',
})
export class InputSelect<T extends InputSelectOption> {
  /** Label displayed for the search field. */
  readonly label = input<string>('Label');

  /** Whether to disable the ripple effect for list items */
  readonly disableRipple = input(false, { transform: booleanAttribute });

  /** All filter options */
  readonly options = input.required<T[]>();

  /** The icon to display in the search field. */
  readonly icon = input<string>();

  /** Whether the input is required. */
  readonly required = input(false, { transform: booleanAttribute });

  /** Supporting text for the search field. */
  readonly supportingText = input<string>();

  /** Currently selected filters */
  readonly selected = model<T[]>([]);

  /** Current search bar value */
  readonly search = model<string>('');

  /** Whether the options list has been opened by the user. */
  protected readonly optionsOpen = signal(false);

  /** Filtered options (after typing in search bar) */
  readonly filteredOptions = computed(() => this.doSearch());

  /** Opens the options list. */
  protected openOptions(): void {
    this.optionsOpen.set(true);
  }

  /** Closes the options list. */
  protected closeOptions(): void {
    this.optionsOpen.set(false);
  }

  /**
   * Updates selected options on update
   * @param event Selected options in list
   */
  selectionUpdate(event: MatListOption[]): void {
    this.selected.set(event.map((option) => option.value));
  }

  /**
   * Filters options according to the search bar value.
   * @returns Options whose labels contain the current search term.
   */
  private doSearch(): T[] {
    const searchTerm = this.search().toLowerCase();
    if (searchTerm === '') {
      return this.options();
    }
    return this.options().filter((option) => option.label.toLowerCase().includes(searchTerm));
  }
}
