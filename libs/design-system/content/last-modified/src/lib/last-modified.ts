import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { LastModifiedDates, parseDate } from './last-modified-dates';

/**
 * Displays when the current page was last modified, e.g. "Last updated on June 16, 2026".
 *
 * The date comes from the `date` input or, when that isn't set, from the current route's entry in
 * {@link LastModifiedDates}. The component hides itself when there is no valid date, so pages without one
 * render nothing.
 */
@Component({
  selector: 'ang-last-modified',
  imports: [DatePipe],
  templateUrl: './last-modified.html',
  styleUrl: './last-modified.scss',
  host: {
    class: 'ang-last-modified',
    '[hidden]': '!resolvedDate()',
  },
})
export class LastModified {
  /**
   * When the page was last modified, as a `Date`, a timestamp in milliseconds, or an ISO 8601 string
   * such as `2026-06-16` or `2026-06-16T14:22:00Z`. Date-only strings are read as local dates;
   * timestamps are shown in the viewer's time zone. Missing or invalid values fall back to the
   * current route's date from {@link LastModifiedDates}.
   */
  readonly date = input<Date | undefined, Date | string | number | null | undefined>(undefined, {
    transform: parseDate,
  });

  /** Text placed before the date. */
  readonly label = input('Last updated on');

  /** Last modified dates of the application's routes. */
  readonly #dates = inject(LastModifiedDates);

  /** The date to display, or `undefined` when there is none. */
  protected readonly resolvedDate = computed(() => this.date() ?? this.#dates.current());
}
