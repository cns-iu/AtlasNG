import { formatNumber } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, LOCALE_ID } from '@angular/core';

/**
 * Displays a localized "value of total" style indicator.
 *
 * Example output: "Showing 5 of 120 results".
 */
@Component({
  selector: 'ang-results',
  template: `{{ text() }}`,
  styleUrl: './results.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Results {
  /** Current value to display (for example, number of visible results). */
  readonly value = input.required<number>();

  /** Maximum or total value to display. */
  readonly total = input.required<number>();

  /** Word or separator symbol between value and total. Defaults to "of". */
  readonly separator = input('of');

  /** Optional text shown before the numeric segment. */
  readonly prefix = input('');

  /** Optional text shown after the numeric segment. */
  readonly suffix = input('');

  /**
   * Final display string composed from prefix/value/separator/total/suffix.
   * Numeric values are localized using the active Angular locale.
   */
  protected readonly text = computed(() => {
    const parts = [
      this.prefix(),
      formatNumber(this.value(), this.locale),
      this.separator(),
      formatNumber(this.total(), this.locale),
      this.suffix(),
    ];

    return parts.join(' ').trim();
  });

  /** Locale used for number formatting, injected from Angular DI. */
  private readonly locale = inject(LOCALE_ID);
}
