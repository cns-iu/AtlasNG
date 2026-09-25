import { DecimalPipe } from '@angular/common';
import { Component, computed, input, model, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import { SearchList, type SearchListItem } from '@atlasng/design-system/filter/search-list';

/** A single active filter rendered as a removable chip. */
export interface FilterChip {
  /** Text shown on the chip. */
  label: string;
}

/**
 * Filter category control: a category button that opens a search list flyout,
 * a unique item counter, active filter chips, and an optional info button and divider.
 */
@Component({
  selector: 'ang-filter-form',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    SearchList,
    TrackClick,
  ],
  templateUrl: './filter-form.html',
  styleUrl: './filter-form.scss',
  providers: [provideEventScope('filter-form')],
  host: { class: 'ang-filter-form' },
})
export class FilterForm<T extends FilterChip> {
  /** Category label shown on the trigger button that opens the search list. */
  readonly category = input.required<string>();

  /** Items shown in the search list flyout. */
  readonly items = input<SearchListItem[]>([]);

  /** Number of unique items available for this filter category. */
  readonly uniqueItemCount = input(0);

  readonly info = input<string>();

  /** Whether the trailing divider is shown. Defaults to true. */
  readonly showDivider = input(true);

  /** Active filter chips shown below the button row. */
  readonly chips = model<T[]>([]);

  /** Emitted when an item is chosen from the search list. */
  readonly itemSelected = output<SearchListItem>();

  /** Emitted when a filter chip is removed. */
  readonly chipRemoved = output<FilterChip>();

  /** Whether any active filter chips should be rendered. */
  protected readonly hasChips = computed(() => this.chips().length > 0);

  /**
   * Handles the removal of a chip
   * @param chip The chip to remove
   */
  removeChip(chip: T): void {
    this.chips.update((current) => current.filter((c) => c.label !== chip.label));
  }
}
