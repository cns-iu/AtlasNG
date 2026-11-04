import { formatDate } from '@angular/common';
import { Component, computed, inject, input, LOCALE_ID } from '@angular/core';
import { PageLastModifiedDates } from './page-last-modified-dates';

/** Format of the displayed date, e.g. `June 16, 2026`. */
const DISPLAY_FORMAT = 'MMMM d, y';

/** Format of the machine-readable `datetime` attribute, e.g. `2026-06-16`. */
const DATETIME_FORMAT = 'yyyy-MM-dd';

/** Values that can be passed as a last modified date. */
export type PageLastModifiedDate = Date | string | number;

/** A last modified date formatted for display and for the `datetime` attribute. */
interface FormattedDate {
  /** Human-readable date, e.g. `June 16, 2026`. */
  display: string;
  /** Machine-readable date, e.g. `2026-06-16`. */
  datetime: string;
}

/**
 * Displays when the current page was last modified, e.g. "Last updated on June 16, 2026".
 *
 * The date comes from the `lastModified` input or, when that isn't set, from the current route's entry in
 * the dates file registered with `providePageLastModified`. The component hides itself when the date is
 * missing or can't be parsed, so pages without last modified metadata render nothing.
 */
@Component({
  selector: 'ang-page-last-modified',
  templateUrl: './page-last-modified.html',
  styleUrl: './page-last-modified.scss',
  host: {
    class: 'ang-page-last-modified',
    '[hidden]': '!date()',
  },
})
export class PageLastModified {
  /**
   * When the page was last modified, as a `Date`, a timestamp in milliseconds, or an ISO 8601 string
   * such as `2026-06-16` or `2026-06-16T14:22:00Z`. Date-only strings are read as local dates;
   * timestamps are shown in the viewer's time zone. When not set, the current route's date from
   * `providePageLastModified` is used.
   */
  readonly lastModified = input<PageLastModifiedDate | null | undefined>();

  /** Text placed before the date. */
  readonly label = input('Last updated on');

  /** Locale used to format the date. */
  readonly #locale = inject(LOCALE_ID);

  /** Route dates registered with `providePageLastModified`, if any. */
  readonly #routeDates = inject(PageLastModifiedDates, { optional: true });

  /** The formatted date, or `undefined` when the date is missing or invalid. */
  protected readonly date = computed(() => this.#format(this.lastModified() ?? this.#routeDates?.current()));

  /**
   * Formats a last modified date for display and for the `datetime` attribute.
   *
   * @param value Date to format.
   * @returns The formatted date, or `undefined` when the value is missing or can't be parsed.
   */
  #format(value: PageLastModifiedDate | null | undefined): FormattedDate | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    try {
      return {
        display: formatDate(value, DISPLAY_FORMAT, this.#locale),
        datetime: formatDate(value, DATETIME_FORMAT, this.#locale),
      };
    } catch {
      return undefined;
    }
  }
}
