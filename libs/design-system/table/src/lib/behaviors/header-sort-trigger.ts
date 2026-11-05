import { Directive, input } from '@angular/core';

/**
 * Marks custom header content as the sort trigger of a sortable header.
 *
 * The table already makes the whole sortable header cell clickable and
 * keyboard-activatable (Enter and Space) and monitors its focus origin, so this
 * directive only applies the `ang-table--header-sort-trigger` class. The callback
 * is kept for API compatibility with existing headers.
 */
@Directive({
  selector: '[angHeaderSortTrigger]',
  host: {
    class: 'ang-table--header-sort-trigger',
  },
})
export class HeaderSortTrigger {
  /** Callback that sorts the column. Unused; the header cell triggers sorting. */
  readonly sortFn = input.required<() => void>({ alias: 'angHeaderSortTrigger' });
}
