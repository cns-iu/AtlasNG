import { assertInInjectionContext, computed, inject, Injector, LOCALE_ID, type Signal } from '@angular/core';

/**
 * User-facing text: a string, or a function returning one.
 *
 * A `Signal<string>` is also a `LocalizedText`, and so is any function that reads signals. Components resolve texts inside
 * `computed()`, so text backed by signals, for example from a translation library, updates when the language changes.
 */
export type LocalizedText = string | (() => string);

/** Plural forms of a text, keyed by CLDR plural category. `other` is required as the fallback. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/** Locale-aware helpers passed to every {@link LocalizedMessage}. */
export interface LocalizationContext {
  /** Locale the helpers format for. */
  readonly locale: string;
  /**
   * Formats a number for the locale with `Intl.NumberFormat`.
   *
   * @param value Number to format.
   * @param options Formatting options, for example `{ notation: 'compact' }`.
   * @returns The formatted number.
   */
  number(value: number, options?: Intl.NumberFormatOptions): string;
  /**
   * Selects the plural form of a text for a count with `Intl.PluralRules`.
   *
   * @param count Count that selects the form.
   * @param forms Forms by plural category. Categories without a form fall back to `other`.
   * @returns The selected form.
   */
  plural(count: number, forms: PluralForms): string;
}

/**
 * User-facing text built from runtime values, such as counts. Receiving the values as parameters lets translations
 * order them freely, and the context formats them and picks plural forms for the active locale.
 *
 * @example
 * ```ts
 * const text: LocalizedMessage<{ count: number }> = ({ count }, { number, plural }) =>
 *   `${number(count)} ${plural(count, { one: 'result', other: 'results' })}`;
 * ```
 */
export type LocalizedMessage<TParams> = (params: TParams, context: LocalizationContext) => string;

/** Injector to read the locale from. Required outside an injection context. */
export interface InjectLocalizationContextOptions {
  /** Injector to read `LOCALE_ID` from. */
  injector?: Injector;
}

/**
 * Resolves a {@link LocalizedText} to a string. Call it inside a reactive context, such as `computed()`, to track the signals a
 * text function reads.
 *
 * @param text Text to resolve.
 * @returns The string.
 */
export function resolveText(text: LocalizedText): string {
  return typeof text === 'function' ? text() : text;
}

/**
 * Creates a signal of a resolved {@link LocalizedText}. Signals the text reads are tracked.
 *
 * @param text Text to resolve.
 * @returns Signal of the string.
 */
export function computedText(text: LocalizedText): Signal<string>;
/**
 * Creates a signal of a resolved {@link LocalizedText} that a source, such as an input, overrides when it is defined.
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
export function computedText(source: () => string | undefined, text: LocalizedText): Signal<string>;
/**
 * Implementation of the {@link computedText} overloads.
 *
 * @param args Text, or source and text.
 * @returns Signal of the string.
 */
export function computedText(...args: [LocalizedText] | [() => string | undefined, LocalizedText]): Signal<string> {
  const [source, text] = args.length === 2 ? args : [undefined, args[0]];
  return computed(() => source?.() ?? resolveText(text));
}

/**
 * Creates a signal of a {@link LocalizedMessage} built from reactive parameters.
 *
 * @param message Message to build.
 * @param params Parameters of the message. Signals it reads are tracked.
 * @param options Context to pass to the message, or the injector to read the locale from. Defaults to the context of
 *   the `LOCALE_ID` of the current injection context.
 * @returns Signal of the string.
 */
export function computedMessage<TParams>(
  message: LocalizedMessage<TParams>,
  params: () => TParams,
  options?: LocalizationContext | InjectLocalizationContextOptions,
): Signal<string>;
/**
 * Creates a signal of a {@link LocalizedMessage} built from reactive parameters, which a source, such as an input, overrides
 * when it is defined.
 *
 * @param source Overriding string, or `undefined` to use the message.
 * @param message Message to build when the source is `undefined`.
 * @param params Parameters of the message. Signals it reads are tracked.
 * @param options Context to pass to the message, or the injector to read the locale from. Defaults to the context of
 *   the `LOCALE_ID` of the current injection context.
 * @returns Signal of the string.
 */
export function computedMessage<TParams>(
  source: () => string | undefined,
  message: LocalizedMessage<TParams>,
  params: () => TParams,
  options?: LocalizationContext | InjectLocalizationContextOptions,
): Signal<string>;
/**
 * Implementation of the {@link computedMessage} overloads.
 *
 * @param args Message, parameters, and options, optionally preceded by a source.
 * @returns Signal of the string.
 * @throws If neither a context nor an injector is given outside an injection context.
 */
export function computedMessage<TParams>(...args: unknown[]): Signal<string> {
  const hasSource = typeof args[2] === 'function';
  const [source, message, params, options] = (hasSource ? args : [undefined, ...args]) as [
    (() => string | undefined) | undefined,
    LocalizedMessage<TParams>,
    () => TParams,
    LocalizationContext | InjectLocalizationContextOptions | undefined,
  ];

  let context: LocalizationContext;
  if (options && 'locale' in options) {
    context = options;
  } else {
    if (!options?.injector) {
      assertInInjectionContext(computedMessage);
    }
    context = injectLocalizationContext(options);
  }

  return computed(() => source?.() ?? message(params(), context));
}

/** Localization contexts by locale, shared so each locale creates its formatters once. */
const LOCALIZATION_CONTEXTS = new Map<string, LocalizationContext>();

/**
 * {@link LocalizationContext} of a locale. Creates its default formatters once, so instances are cached per locale by
 * {@link getLocalizationContext}. Methods are arrow functions so messages can destructure them from the context.
 */
class LocalizationContextImpl implements LocalizationContext {
  /** Number format of the locale without options. */
  readonly #numberFormat: Intl.NumberFormat;
  /** Plural rules of the locale. */
  readonly #pluralRules: Intl.PluralRules;

  /**
   * Creates the context and the default formatters of a locale.
   *
   * @param locale Locale to format for.
   */
  constructor(readonly locale: string) {
    this.#numberFormat = new Intl.NumberFormat(locale);
    this.#pluralRules = new Intl.PluralRules(locale);
  }

  /**
   * Formats a number for the locale. Options create a new `Intl.NumberFormat` on each call.
   *
   * @param value Number to format.
   * @param options Formatting options, for example `{ notation: 'compact' }`.
   * @returns The formatted number.
   */
  readonly number = (value: number, options?: Intl.NumberFormatOptions): string => {
    const format = options ? new Intl.NumberFormat(this.locale, options) : this.#numberFormat;
    return format.format(value);
  };

  /**
   * Selects the plural form of a text for a count.
   *
   * @param count Count that selects the form.
   * @param forms Forms by plural category. Categories without a form fall back to `other`.
   * @returns The selected form.
   */
  readonly plural = (count: number, forms: PluralForms): string => {
    return forms[this.#pluralRules.select(count)] ?? forms.other;
  };
}

/**
 * Returns the localization context of a locale. Contexts are cached, so every call with the same locale returns the same
 * instance.
 *
 * @param locale Locale to format for, such as the injected `LOCALE_ID`.
 * @returns The localization context.
 */
export function getLocalizationContext(locale: string): LocalizationContext {
  let context = LOCALIZATION_CONTEXTS.get(locale);
  if (!context) {
    context = new LocalizationContextImpl(locale);
    LOCALIZATION_CONTEXTS.set(locale, context);
  }

  return context;
}

/**
 * Injects the localization context of the active `LOCALE_ID`.
 *
 * @param options Injector to read the locale from. Required outside an injection context.
 * @returns The localization context.
 */
export function injectLocalizationContext(options?: InjectLocalizationContextOptions): LocalizationContext {
  if (!options?.injector) {
    assertInInjectionContext(injectLocalizationContext);
  }

  const injector = options?.injector ?? inject(Injector);
  return getLocalizationContext(injector.get(LOCALE_ID));
}
