import type { Provider } from '@angular/core';
import { createConfigurationToken, type, type Message } from '@atlasng/core';

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

/** User-facing text of the results indicator. */
export interface ResultsIndicatorMessages {
  /** Text of the indicator. Defaults to "[value] of [total]". */
  text?: Message<ResultsIndicatorParams>;
}

/** Text of every results indicator below the injector. */
export const RESULTS_INDICATOR_MESSAGES = createConfigurationToken({
  name: 'RESULTS_INDICATOR_MESSAGES',
  config: type<ResultsIndicatorMessages>(),
  defaults: () => ({
    text: ({ formattedValue, formattedTotal }: ResultsIndicatorParams) => `${formattedValue} of ${formattedTotal}`,
  }),
  inherit: true,
});

/**
 * Provides the text of every results indicator below the injector. Provided messages are merged over the parent's.
 *
 * @example
 * ```ts
 * provideResultsIndicatorMessages({
 *   text: ({ formattedValue, formattedTotal, total, locale }) =>
 *     `${formattedValue} sur ${formattedTotal} ${plural(locale, total, { one: 'résultat', other: 'résultats' })}`,
 * });
 * ```
 *
 * @param messages Messages, or a factory run in an injection context that returns them.
 * @returns Provider for the messages.
 */
export function provideResultsIndicatorMessages(
  messages: ResultsIndicatorMessages | (() => ResultsIndicatorMessages),
): Provider {
  return RESULTS_INDICATOR_MESSAGES.provide(messages);
}
