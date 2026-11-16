import { booleanAttribute, Component, computed, input } from '@angular/core';
import { Announce } from '@atlasng/cdk/a11y';
import { computedMessage } from '@atlasng/core';
import { RESULTS_INDICATOR_MESSAGES } from './config';

/**
 * Displays a localized "value of total" style indicator.
 *
 * Example output: "5 of 120". The text comes from `provideResultsIndicatorMessages`.
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

  /**
   * Optional text shown before the message.
   *
   * @deprecated Use `provideResultsIndicatorMessages`, which can place the values anywhere in the text.
   */
  readonly prefix = input('');

  /**
   * Optional text shown after the message.
   *
   * @deprecated Use `provideResultsIndicatorMessages`, which can place the values anywhere in the text.
   */
  readonly suffix = input('');

  /** Stops announcing changes to screen readers, for consumers that announce them another way. */
  readonly announceDisabled = input(false, { transform: booleanAttribute });

  /** Text of the indicator. */
  readonly #messages = RESULTS_INDICATOR_MESSAGES.inject();

  /** Text from the provided messages, with the values formatted for the active Angular locale. */
  readonly #message = computedMessage(this.#messages.text, () => ({ value: this.value(), total: this.total() }));

  /** Display text, including the deprecated prefix and suffix. */
  protected readonly text = computed(() => [this.prefix(), this.#message(), this.suffix()].join(' ').trim());
}
