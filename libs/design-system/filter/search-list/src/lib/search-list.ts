import { Component, input, output } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';

/** A single selectable entry rendered in a `SearchList` flyout. */
export interface SearchListItem {
  /** Stable identifier for the item. */
  value: string;
  /** Text shown for the item. */
  label: string;
  info?: string;
}

/**
 * Flyout list of selectable items, intended for use as the content of a
 * `mat-menu` panel anchored to a trigger button (see `ang-filter-form`).
 */
@Component({
  selector: 'ang-search-list',
  imports: [MatMenuModule],
  templateUrl: './search-list.html',
  styleUrl: './search-list.scss',
  host: { class: 'ang-search-list' },
})
export class SearchList {
  /** Items rendered in the list. */
  readonly items = input<SearchListItem[]>([]);

  /** Emitted when an item is chosen. */
  readonly itemSelected = output<SearchListItem>();
}
