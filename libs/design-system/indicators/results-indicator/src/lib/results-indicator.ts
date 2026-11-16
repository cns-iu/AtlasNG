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

/** Milliseconds the text has to stay the same before screen readers announce it. */
const ANNOUNCE_DELAY = 1000;

/**
 * Displays a localized "value of total" style indicator.
 *
 * Example output: "Showing 5 of 120 results".
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

  /** Word or separator symbol between value and total. Defaults to "of". */
  readonly separator = input('of');

  /** Optional text shown before the numeric segment. */
  readonly prefix = input('');

  /** Optional text shown after the numeric segment. */
  readonly suffix = input('');

  /**
   * Removes the `status` role so screen readers don't announce changes, for
   * consumers that announce them another way.
   */
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
