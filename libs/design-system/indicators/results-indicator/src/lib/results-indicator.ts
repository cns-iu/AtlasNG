import { formatNumber } from '@angular/common';
import {
  booleanAttribute,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  LOCALE_ID,
  untracked,
} from '@angular/core';
import { computedMessage } from '@atlasng/core';
import { RESULTS_INDICATOR_MESSAGES, type ResultsIndicatorParams } from './config';

/** Milliseconds the text has to stay the same before screen readers announce it. */
const ANNOUNCE_DELAY = 1000;

/**
 * Displays a localized "value of total" style indicator.
 *
 * Example output: "5 of 120". The text comes from `provideResultsIndicatorMessages`.
 *
 * The host is a `status` live region, so screen readers announce changes to the
 * text without moving focus. The visible text updates immediately, while the
 * announced copy waits until the text stops changing, so typing in a search
 * field queues one announcement instead of one per keystroke.
 */
@Component({
  selector: 'ang-results-indicator',
  template: `
    <span aria-hidden="true">{{ text() }}</span>
    <span class="cdk-visually-hidden">{{ announcedText() }}</span>
  `,
  styleUrl: './results-indicator.scss',
  host: {
    class: 'ang-results-indicator',
    '[attr.role]': 'announceDisabled() ? null : "status"',
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

  /**
   * Removes the `status` role so screen readers don't announce changes, for
   * consumers that announce them another way.
   */
  readonly announceDisabled = input(false, { transform: booleanAttribute });

  /** Locale used for number formatting, injected from Angular DI. */
  readonly #locale = inject(LOCALE_ID);

  /** Text of the indicator. */
  readonly #messages = RESULTS_INDICATOR_MESSAGES.inject();

  /** Parameters of the message, with the values formatted for the active Angular locale. */
  readonly #params = computed((): ResultsIndicatorParams => ({
    value: this.value(),
    total: this.total(),
    formattedValue: formatNumber(this.value(), this.#locale),
    formattedTotal: formatNumber(this.total(), this.#locale),
    locale: this.#locale,
  }));

  /** Text from the provided messages. */
  readonly #message = computedMessage(this.#messages.text, this.#params);

  /** Display text, including the deprecated prefix and suffix. */
  protected readonly text = computed(() => [this.prefix(), this.#message(), this.suffix()].join(' ').trim());

  /**
   * Text read by screen readers. Starts as {@link text} and then follows it
   * {@link ANNOUNCE_DELAY} milliseconds after its last change, or immediately
   * while announcements are disabled.
   */
  protected readonly announcedText = linkedSignal<{ text: string; immediate: boolean }, string>({
    source: () => ({ text: this.text(), immediate: this.announceDisabled() }),
    computation: (current, previous) => (current.immediate || !previous ? current.text : previous.value),
  });

  /** Schedules the announcement of each new text, restarting the delay whenever the text changes again. */
  constructor() {
    effect((onCleanup) => {
      const text = this.text();
      if (!this.announceDisabled() && text !== untracked(this.announcedText)) {
        const timeout = setTimeout(() => this.announcedText.set(text), ANNOUNCE_DELAY);
        onCleanup(() => clearTimeout(timeout));
      }
    });
  }
}
