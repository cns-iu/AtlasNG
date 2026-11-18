import {
  afterRenderEffect,
  booleanAttribute,
  Component,
  ElementRef,
  input,
  output,
  ViewEncapsulation,
  viewChildren,
} from '@angular/core';
import { MatChip, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { EventScope, TrackClick } from '@atlasng/analytics';
import { SearchListOption } from '@atlasng/design-system/search-list';

/**
 * Removable chips for the options selected in a multi-select filter. Chips animate in and out
 * unless the user prefers reduced motion.
 *
 * By default, the chips wrap onto as many rows as they need. In a single row, they don't wrap, so
 * the list can sit in a horizontal scroll area, and selecting an option scrolls its new chip
 * into view.
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
  /** Selected options, shown as chips in order. New selections are expected at the end. */
  readonly options = input.required<T[]>();

  /** Accessible label of the list. */
  readonly label = input.required<string>();

  /** Prefix of each chip's remove button label, followed by the option label. */
  readonly removeLabel = input.required<string>();

  /** Whether the chips stay in a single row instead of wrapping. */
  readonly singleRow = input(false, { transform: booleanAttribute });

  /** Emits the option whose chip was removed. */
  readonly removed = output<T>();

  /** Rendered chips, used to scroll the newest one into view. */
  private readonly chips = viewChildren<MatChip, ElementRef<HTMLElement>>(MatChip, { read: ElementRef });

  /** Scrolls the newest chip into view whenever a chip is added to a single row. */
  constructor() {
    let previousCount: number | undefined;
    afterRenderEffect(() => {
      const chips = this.chips();
      const added = previousCount !== undefined && chips.length > previousCount;
      previousCount = chips.length;
      if (added && this.singleRow()) {
        chips.at(-1)?.nativeElement.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      }
    });
  }
}
