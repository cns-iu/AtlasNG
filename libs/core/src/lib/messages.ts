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
