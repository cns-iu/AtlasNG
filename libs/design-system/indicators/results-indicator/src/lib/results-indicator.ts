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
import { createConfigurationToken, type, type Message } from '@atlasng/core';

/** Milliseconds the text has to stay the same before screen readers announce it. */
const ANNOUNCE_DELAY = 1000;

/** Values passed to the {@link ResultsIndicatorMessages.text} message. */
export interface ResultsIndicatorParams {
  /** Current value. */
  value: number;
  /** Total value. */
  total: number;
  /** `value` formatted for `locale`. */
  formattedValue: string;
  /** `total` formatted for `locale`. */
  formattedTotal: string;
  /** Active Angular locale, for example to select plural forms with `plural`. */
  locale: string;
}

/** User-facing text of {@link ResultsIndicator}. */
export interface ResultsIndicatorMessages {
  /** Text of the indicator. Defaults to "[value] of [total]". */
  text?: Message<ResultsIndicatorParams>;
}

/**
 * Text of every {@link ResultsIndicator} below the injector. Provided messages are merged over the parent's.
 *
 * @example
 * ```ts
 * RESULTS_INDICATOR_MESSAGES.provide({
 *   text: ({ formattedValue, formattedTotal, total, locale }) =>
 *     `${formattedValue} sur ${formattedTotal} ${plural(locale, total, { one: 'résultat', other: 'résultats' })}`,
 * });
 * ```
 */
export const RESULTS_INDICATOR_MESSAGES = createConfigurationToken({
  name: 'RESULTS_INDICATOR_MESSAGES',
  config: type<ResultsIndicatorMessages>(),
  defaults: () => ({
    text: ({ formattedValue, formattedTotal }: ResultsIndicatorParams) => `${formattedValue} of ${formattedTotal}`,
  }),
  inherit: true,
});

/**
 * Displays a localized "value of total" style indicator.
 *
 * Example output: "5 of 120". The text comes from {@link RESULTS_INDICATOR_MESSAGES} or the `message` input.
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

  /** Text of this indicator. Defaults to the `text` of {@link RESULTS_INDICATOR_MESSAGES}. */
  readonly message = input<Message<ResultsIndicatorParams>>();

  /**
   * Optional text shown before the message.
   *
   * @deprecated Use `message` or {@link RESULTS_INDICATOR_MESSAGES}, which can place the values anywhere in the text.
   */
  readonly prefix = input('');

  /**
   * Optional text shown after the message.
   *
   * @deprecated Use `message` or {@link RESULTS_INDICATOR_MESSAGES}, which can place the values anywhere in the text.
   */
  readonly suffix = input('');

  /**
   * Removes the `status` role so screen readers don't announce changes, for
   * consumers that announce them another way.
   */
  readonly announceDisabled = input(false, { transform: booleanAttribute });

  /** Display text: the message with the values formatted for the active Angular locale. */
  protected readonly text = computed(() => {
    const locale = this.#locale;
    const value = this.value();
    const total = this.total();
    const message = this.message() ?? this.#messages.text;
    const text = message({
      value,
      total,
      formattedValue: formatNumber(value, locale),
      formattedTotal: formatNumber(total, locale),
      locale,
    });

    return [this.prefix(), text, this.suffix()].join(' ').trim();
  });

  /**
   * Text read by screen readers. Starts as {@link text} and then follows it
   * {@link ANNOUNCE_DELAY} milliseconds after its last change, or immediately
   * while announcements are disabled.
   */
  protected readonly announcedText = linkedSignal<{ text: string; immediate: boolean }, string>({
    source: () => ({ text: this.text(), immediate: this.announceDisabled() }),
    computation: (current, previous) => (current.immediate || !previous ? current.text : previous.value),
  });

  /** Locale used for number formatting, injected from Angular DI. */
  readonly #locale = inject(LOCALE_ID);

  /** Text of the indicator. */
  readonly #messages = RESULTS_INDICATOR_MESSAGES.inject();

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
