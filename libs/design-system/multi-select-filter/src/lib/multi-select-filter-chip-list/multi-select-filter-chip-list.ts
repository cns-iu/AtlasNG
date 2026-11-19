import { booleanAttribute, Component, input, output, ViewEncapsulation } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { EventScope, TrackClick } from '@atlasng/analytics';
import { SearchListOption } from '@atlasng/design-system/search-list';

/**
 * Removable chips for the options selected in a multi-select filter. Chips animate in and out
 * unless the user prefers reduced motion.
 *
 * By default, the chips wrap onto as many rows as they need. In a single row, they don't wrap, so
 * the list can sit in a horizontal scroll area.
 */
@Component({
  selector: 'ang-multi-select-filter-chip-list',
  imports: [EventScope, MatChipsModule, MatIconModule, TrackClick],
  templateUrl: './multi-select-filter-chip-list.html',
  styleUrl: './multi-select-filter-chip-list.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-multi-select-filter-chip-list',
    '[class.ang-multi-select-filter-chip-list--single-row]': 'singleRow()',
  },
})
export class MultiSelectFilterChipList<T extends SearchListOption> {
  /** Selected options, shown as chips in the given order. */
  readonly options = input.required<T[]>();

  /** Accessible label of the list. */
  readonly label = input.required<string>();

  /** Prefix of each chip's remove button label, followed by the option label. */
  readonly removeLabel = input.required<string>();

  /** Whether the chips stay in a single row instead of wrapping. */
  readonly singleRow = input(false, { transform: booleanAttribute });

  /** Emits the option whose chip was removed. */
  readonly removed = output<T>();
}
