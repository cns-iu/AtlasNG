import { type AriaLivePoliteness, LiveAnnouncer } from '@angular/cdk/a11y';
import { booleanAttribute, Directive, effect, inject, input } from '@angular/core';
import { StyleLoader } from '@atlasng/cdk';
import { VisuallyHiddenStyles } from '../visually-hidden/visually-hidden';
import { ANNOUNCE_CONFIG } from './config';

/**
 * Announces changes to a text with the CDK `LiveAnnouncer` once the text stops changing, so typing in a search field
 * queues one announcement instead of one per keystroke.
 *
 * Also loads the `cdk-visually-hidden` styles, which the `LiveAnnouncer` uses to hide its message element but does not
 * load itself.
 *
 * The initial text and empty texts are not announced. Defaults for the delay, politeness, and duration come from
 * `provideAnnounceConfig`.
 *
 * @example
 * ```html
 * <span [angAnnounce]="resultsText()">{{ resultsText() }}</span>
 * ```
 */
@Directive({
  selector: '[angAnnounce]',
})
export class Announce {
  /** Text to announce when it changes. */
  readonly text = input.required<string>({ alias: 'angAnnounce' });

  /** Milliseconds the text has to stay the same before it is announced. Defaults to the configured `delay`. */
  readonly delay = input<number>(undefined, { alias: 'angAnnounceDelay' });

  /** Politeness of the announcements. Defaults to the configured `politeness`. */
  readonly politeness = input<AriaLivePoliteness>(undefined, { alias: 'angAnnouncePoliteness' });

  /** Milliseconds before announcements are cleared. Defaults to the configured `duration`. */
  readonly duration = input<number>(undefined, { alias: 'angAnnounceDuration' });

  /** Stops announcing changes, for example for consumers that announce them another way. */
  readonly disabled = input(false, { alias: 'angAnnounceDisabled', transform: booleanAttribute });

  /** Defaults of the directive. */
  readonly #config = ANNOUNCE_CONFIG.inject();

  /** Announcer that reads the text to screen readers. */
  readonly #liveAnnouncer = inject(LiveAnnouncer);

  /** Last text announced or skipped, or `undefined` before the initial text is read. */
  #announced: string | undefined;

  /**
   * Loads the visually hidden styles and schedules the announcement of each new text, restarting the delay whenever
   * the text changes again.
   */
  constructor() {
    inject(StyleLoader).load(VisuallyHiddenStyles);

    effect((onCleanup) => {
      const text = this.text();
      if (this.#announced === undefined || this.disabled() || !text) {
        this.#announced = text;
        return;
      }
      if (text === this.#announced) {
        return;
      }

      const delay = this.delay() ?? this.#config.delay;
      const politeness = this.politeness() ?? this.#config.politeness;
      const duration = this.duration() ?? this.#config.duration;
      const timeout = setTimeout(() => {
        this.#announced = text;
        void this.#liveAnnouncer.announce(text, politeness, duration);
      }, delay);
      onCleanup(() => clearTimeout(timeout));
    });
  }
}
