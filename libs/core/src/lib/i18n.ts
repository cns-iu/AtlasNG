import { assertInInjectionContext, computed, inject, Injector, LOCALE_ID, type Signal } from '@angular/core';

/**
 * User-facing text: a string, or a function returning one.
 *
 * A `Signal<string>` is also a `Text`, and so is any function that reads signals. Components resolve texts inside
 * `computed()`, so text backed by signals, for example from a translation library, updates when the language changes.
 */
export type Text = string | (() => string);

/** Plural forms of a text, keyed by CLDR plural category. `other` is required as the fallback. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/** Locale-aware helpers passed to every {@link Message}. */
export interface MessageContext {
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
 * const text: Message<{ count: number }> = ({ count }, { number, plural }) =>
 *   `${number(count)} ${plural(count, { one: 'result', other: 'results' })}`;
 * ```
 */
export type Message<TParams> = (params: TParams, context: MessageContext) => string;

/** Injector to read the locale from. Required outside an injection context. */
export interface InjectMessageContextOptions {
  /** Injector to read `LOCALE_ID` from. */
  injector?: Injector;
}

/** Message contexts by locale, shared so each locale creates its formatters once. */
const MESSAGE_CONTEXTS = new Map<string, MessageContext>();

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
 * @param options Context to pass to the message, or the injector to read the locale from. Defaults to the context of
 *   the `LOCALE_ID` of the current injection context.
 * @returns Signal of the string.
 */
export function computedMessage<TParams>(
  message: Message<TParams>,
  params: () => TParams,
  options?: MessageContext | InjectMessageContextOptions,
): Signal<string>;
/**
 * Creates a signal of a {@link Message} built from reactive parameters, which a source, such as an input, overrides
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
  message: Message<TParams>,
  params: () => TParams,
  options?: MessageContext | InjectMessageContextOptions,
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
    Message<TParams>,
    () => TParams,
    MessageContext | InjectMessageContextOptions | undefined,
  ];

  let context: MessageContext;
  if (options && 'locale' in options) {
    context = options;
  } else {
    if (!options?.injector) {
      assertInInjectionContext(computedMessage);
    }
    context = injectMessageContext(options);
  }

  return computed(() => source?.() ?? message(params(), context));
}

/**
 * Returns the message context of a locale. Contexts are cached, so every call with the same locale returns the same
 * instance.
 *
 * @param locale Locale to format for, such as the injected `LOCALE_ID`.
 * @returns The message context.
 */
export function getMessageContext(locale: string): MessageContext {
  let context = MESSAGE_CONTEXTS.get(locale);
  if (!context) {
    const numberFormat = new Intl.NumberFormat(locale);
    const pluralRules = new Intl.PluralRules(locale);
    context = {
      locale,
      number: (value, options) => (options ? new Intl.NumberFormat(locale, options) : numberFormat).format(value),
      plural: (count, forms) => forms[pluralRules.select(count)] ?? forms.other,
    };
    MESSAGE_CONTEXTS.set(locale, context);
  }

  return context;
}

/**
 * Injects the message context of the active `LOCALE_ID`.
 *
 * @param options Injector to read the locale from. Required outside an injection context.
 * @returns The message context.
 */
export function injectMessageContext(options?: InjectMessageContextOptions): MessageContext {
  if (!options?.injector) {
    assertInInjectionContext(injectMessageContext);
  }

  const injector = options?.injector ?? inject(Injector);
  return getMessageContext(injector.get(LOCALE_ID));
}
