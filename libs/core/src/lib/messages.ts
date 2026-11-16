import { computed, type Signal } from '@angular/core';

/**
 * User-facing text: a string, or a function returning one.
 *
 * A `Signal<string>` is also a `Text`, and so is any function that reads signals. Components resolve texts inside
 * `computed()`, so text backed by signals, for example from a translation library, updates when the language changes.
 */
export type Text = string | (() => string);

/**
 * User-facing text built from runtime values, such as counts. Receiving the values as parameters lets translations
 * order them freely and pick plural forms, instead of the component concatenating fragments.
 */
export type Message<TParams> = (params: TParams) => string;

/** Plural forms of a text, keyed by CLDR plural category. `other` is required as the fallback. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/**
 * Resolves a {@link Text} to a string. Call it inside a reactive context, such as `computed()`, to track the signals a
 * text function reads.
 *
 * @param text Text to resolve.
 * @returns The string.
 */
export function resolveText(text: Text): string {
  return typeof text === 'function' ? text() : text;
}

/**
 * Creates a signal of a resolved {@link Text}. Signals the text reads are tracked.
 *
 * @param text Text to resolve.
 * @returns Signal of the string.
 */
export function computedText(text: Text): Signal<string>;
/**
 * Creates a signal of a resolved {@link Text} that a source, such as an input, overrides when it is defined.
 *
 * @example
 * ```ts
 * protected readonly labelText = computedText(this.label, this.#messages.label);
 * ```
 *
 * @param source Overriding string, or `undefined` to use the text.
 * @param text Text to resolve when the source is `undefined`.
 * @returns Signal of the string.
 */
export function computedText(source: () => string | undefined, text: Text): Signal<string>;
/**
 * Implementation of the {@link computedText} overloads.
 *
 * @param args Text, or source and text.
 * @returns Signal of the string.
 */
export function computedText(...args: [Text] | [() => string | undefined, Text]): Signal<string> {
  const [source, text] = args.length === 2 ? args : [undefined, args[0]];
  return computed(() => source?.() ?? resolveText(text));
}

/**
 * Creates a signal of a {@link Message} built from reactive parameters.
 *
 * @param message Message to build.
 * @param params Parameters of the message. Signals it reads are tracked.
 * @returns Signal of the string.
 */
export function computedMessage<TParams>(message: Message<TParams>, params: () => TParams): Signal<string>;
/**
 * Creates a signal of a {@link Message} built from reactive parameters, which a source, such as an input, overrides
 * when it is defined.
 *
 * @param source Overriding string, or `undefined` to use the message.
 * @param message Message to build when the source is `undefined`.
 * @param params Parameters of the message. Signals it reads are tracked.
 * @returns Signal of the string.
 */
export function computedMessage<TParams>(
  source: () => string | undefined,
  message: Message<TParams>,
  params: () => TParams,
): Signal<string>;
/**
 * Implementation of the {@link computedMessage} overloads.
 *
 * @param args Message and parameters, or source, message, and parameters.
 * @returns Signal of the string.
 */
export function computedMessage<TParams>(
  ...args: [Message<TParams>, () => TParams] | [() => string | undefined, Message<TParams>, () => TParams]
): Signal<string> {
  const [source, message, params] = args.length === 3 ? args : [undefined, ...args];
  return computed(() => source?.() ?? message(params()));
}

/**
 * Selects the plural form of a text for a count with `Intl.PluralRules`.
 *
 * @example
 * ```ts
 * plural('en-US', count, { one: 'result', other: 'results' });
 * ```
 *
 * @param locale Locale whose plural rules apply, such as the injected `LOCALE_ID`.
 * @param count Count that selects the form.
 * @param forms Forms by plural category. Categories without a form fall back to `other`.
 * @returns The selected form.
 */
export function plural(locale: string, count: number, forms: PluralForms): string {
  return forms[new Intl.PluralRules(locale).select(count)] ?? forms.other;
}
