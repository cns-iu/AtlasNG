import { formatNumber } from '@angular/common';
import { booleanAttribute, Component, computed, inject, input, LOCALE_ID } from '@angular/core';
import { Announce } from '@atlasng/cdk/a11y';

/**
 * Displays a localized "value of total" style indicator.
 *
 * Example output: "Showing 5 of 120 results".
 *
 * Changes to the text are announced to screen readers with the `angAnnounce` directive once the text stops
 * changing, so typing in a search field queues one announcement instead of one per keystroke. Configure the delay,
 * politeness, and duration with `provideAnnounceConfig` from `@atlasng/cdk/a11y`.
 */
@Component({
  selector: 'ang-results-indicator',
  imports: [Announce],
  template: `<span [angAnnounce]="text()" [angAnnounceDisabled]="announceDisabled()">{{ text() }}</span>`,
  styleUrl: './results-indicator.scss',
  host: {
    class: 'ang-results-indicator',
  },
})
export class ResultsIndicator {
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

  /** Stops announcing changes to screen readers, for consumers that announce them another way. */
  readonly announceDisabled = input(false, { transform: booleanAttribute });

  /**
   * Final display string composed from prefix/value/separator/total/suffix.
   * Numeric values are localized using the active Angular locale.
   */
  protected readonly text = computed(() => {
    const parts = [
      this.prefix(),
      formatNumber(this.value(), this.#locale),
      this.separator(),
      formatNumber(this.total(), this.#locale),
      this.suffix(),
    ];

    return parts.join(' ').trim();
  });

  /** Locale used for number formatting, injected from Angular DI. */
  readonly #locale = inject(LOCALE_ID);
}
