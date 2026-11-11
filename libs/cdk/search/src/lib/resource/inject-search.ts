import {
  assertInInjectionContext,
  computed,
  effect,
  inject,
  Injector,
  isSignal,
  linkedSignal,
  runInInjectionContext,
  Signal,
  signal,
  untracked,
} from '@angular/core';
import {
  SearchEngine,
  SearchFieldDefinition,
  SearchFieldSpec,
  SearchOrder,
  SearchResult,
  SearchSuggestion,
} from '../engine/types';
import { DEFAULT_SEARCH_VALUE_FIELD, isSearchPrimitive } from '../engine/values';
import { SEARCH_CONFIG, SEARCH_ENGINE } from '../providers';
import { ContextualResponse, resolveResponse } from './resolve-response';

/** A value or a signal of a value. */
export type MaybeSignal<T> = T | Signal<T>;

/**
 * Options for {@link injectSearch}. Every option accepts a signal and is read reactively, so options can come from
 * component inputs even though `injectSearch` runs in a field initializer, before the inputs are set.
 */
export interface InjectSearchOptions<T> {
  /** Items to search. The index is rebuilt when the items change. */
  items: MaybeSignal<readonly T[]>;
  /** Search term. */
  term: MaybeSignal<string>;
  /** Fields to search. The index is rebuilt when the fields change. Defaults to every string and number value. */
  fields?: MaybeSignal<readonly SearchFieldSpec<T>[] | undefined>;
  /** Maximum number of results. Defaults to no limit. */
  limit?: MaybeSignal<number | undefined>;
  /** Order of the results. Defaults to `'rank'`; `'source'` keeps the order of the items. */
  order?: MaybeSignal<SearchOrder | undefined>;
  /** Milliseconds to wait after the term stops changing before searching. Defaults to the configured `debounce`. */
  debounce?: MaybeSignal<number | undefined>;
  /** Minimum trimmed term length that triggers a search. Defaults to the configured `minLength`. */
  minLength?: MaybeSignal<number | undefined>;
  /**
   * Field whose values are suggested. When omitted, string and number items are suggested themselves and other items
   * produce no suggestions.
   */
  suggestionField?: MaybeSignal<SearchFieldSpec<T> | undefined>;
  /** Maximum number of suggestions. Defaults to the configured `suggestionLimit`. */
  suggestionLimit?: MaybeSignal<number | undefined>;
  /** Engine to use instead of the injected `SEARCH_ENGINE`. */
  engine?: MaybeSignal<SearchEngine | undefined>;
  /** Injector used outside an injection context. */
  injector?: Injector;
}

/** Signals returned by {@link injectSearch}. */
export interface SearchRef<T> {
  /** Results in the requested order; every item, without scores, when the term is too short. */
  readonly results: Signal<readonly SearchResult<T>[]>;
  /** The items of {@link results}. */
  readonly items: Signal<readonly T[]>;
  /** Suggested values with their match ranges; empty when the term is too short or nothing can be suggested. */
  readonly suggestions: Signal<readonly SearchSuggestion[]>;
  /** True while an asynchronous search or suggestion request is pending. */
  readonly loading: Signal<boolean>;
  /** The error of the last failed asynchronous request, if any. */
  readonly error: Signal<unknown>;
}

/** Suggests string and number items themselves. Used when no suggestion field is given. */
const PRIMITIVE_SUGGESTION_FIELD: SearchFieldDefinition<unknown> = {
  name: DEFAULT_SEARCH_VALUE_FIELD,
  get: (item) => (isSearchPrimitive(item) ? item : undefined),
};

/**
 * Searches a list of items with the injected `SEARCH_ENGINE` and exposes the results as signals. Must be called in an
 * injection context unless an injector is provided.
 *
 * The index is rebuilt only when the items, fields, or engine change. Synchronous engines update the results
 * synchronously (after the debounce, if any). While an asynchronous request for a new term is pending, the previous
 * results are kept; when the items or other options changed, the results are empty until the request resolves.
 *
 * @param options Search options.
 * @returns Signals with the results, matched items, suggestions, and loading state.
 * @example
 * readonly term = signal('');
 * readonly search = injectSearch({ items: this.options, term: this.term, fields: ['label', 'description'] });
 */
export function injectSearch<T>(options: InjectSearchOptions<T>): SearchRef<T> {
  if (!options.injector) {
    assertInInjectionContext(injectSearch);
  }
  const injector = options.injector ?? inject(Injector);
  const config = untracked(() => runInInjectionContext(injector, () => SEARCH_CONFIG.inject()));

  const items = toSignal(options.items);
  const fields = toSignal(options.fields);
  const limit = toSignal(options.limit);
  const order = toSignal(options.order);
  const suggestionField = toSignal(options.suggestionField);
  const engineOption = toSignal(options.engine);
  const engine = computed(() => engineOption() ?? injector.get(SEARCH_ENGINE));
  const minLength = withDefault(options.minLength, config.minLength ?? 1);
  const suggestionLimit = withDefault(options.suggestionLimit, config.suggestionLimit);
  const debounce = withDefault(options.debounce, config.debounce ?? 0);
  const term = debounceTerm(toSignal(options.term), debounce, minLength, injector);
  const active = computed(() => {
    const length = term().trim().length;
    return length > 0 && length >= minLength();
  });

  const index = computed(() => {
    const currentEngine = engine();
    const currentItems = items();
    const currentFields = fields();
    return untracked(() => currentEngine.createIndex(currentItems, currentFields));
  });
  const suggestionIndex = computed(() => {
    const currentEngine = engine();
    const currentItems = items();
    const field = suggestionField() ?? defaultSuggestionField(currentItems);
    return field === undefined ? undefined : untracked(() => currentEngine.createIndex(currentItems, [field]));
  });

  const searchContext = computed(() => ({
    items: items(),
    fields: fields(),
    engine: engine(),
    limit: limit(),
    order: order(),
  }));
  const searched = resolveResponse(
    computed((): ContextualResponse<SearchResult<T>> => {
      const context = searchContext();
      if (!active()) {
        return { response: items().map((item): SearchResult<T> => ({ item })), context };
      }
      const currentIndex = index();
      const query = { term: term(), limit: limit(), order: order() };
      return { response: untracked(() => currentIndex.search(query)), context };
    }),
    injector,
  );

  const suggestionContext = computed(() => ({ index: suggestionIndex(), limit: suggestionLimit() }));
  const suggested = resolveResponse(
    computed((): ContextualResponse<SearchSuggestion> => {
      const context = suggestionContext();
      const currentIndex = context.index;
      if (!active() || !currentIndex?.suggest) {
        return { response: [], context };
      }
      const currentTerm = term();
      return { response: untracked(() => currentIndex.suggest?.(currentTerm, context.limit) ?? []), context };
    }),
    injector,
  );

  const results = searched.value;
  return {
    results,
    items: computed(() => results().map((result) => result.item)),
    suggestions: suggested.value,
    loading: computed(() => searched.loading() || suggested.loading()),
    error: computed(() => searched.error() ?? suggested.error()),
  };
}

/**
 * Picks the field suggested when no suggestion field is given: the items themselves when any of them is a string or
 * number.
 *
 * @param items Items to search.
 * @returns The primitive suggestion field, or `undefined` when nothing can be suggested.
 */
function defaultSuggestionField<T>(items: readonly T[]): SearchFieldSpec<T> | undefined {
  return items.some(isSearchPrimitive) ? (PRIMITIVE_SUGGESTION_FIELD as SearchFieldDefinition<T>) : undefined;
}

/**
 * Wraps an optional value or signal in a signal that falls back to a default when the value is `undefined`.
 *
 * @param value An optional value or signal.
 * @param fallback Value used while `value` is `undefined`.
 * @returns A signal of the value or the fallback.
 */
function withDefault<T>(value: MaybeSignal<T | undefined>, fallback: T): Signal<T> {
  const source = toSignal(value);
  return computed(() => source() ?? fallback);
}

/**
 * Wraps a value in a signal unless it already is one.
 *
 * @param value A value or signal.
 * @returns A signal of the value.
 */
function toSignal<T>(value: MaybeSignal<T>): Signal<T> {
  return isSignal(value) ? value : signal(value).asReadonly();
}

/**
 * Debounces a search term. Terms shorter than the minimum length, such as a cleared term, apply immediately, as does
 * every term while the delay is `0` or less.
 *
 * @param term Search term.
 * @param delay Debounce in milliseconds.
 * @param minLength Minimum trimmed term length that triggers a search.
 * @param injector Injector for the debounce effect.
 * @returns The debounced term.
 */
function debounceTerm(
  term: Signal<string>,
  delay: Signal<number>,
  minLength: Signal<number>,
  injector: Injector,
): Signal<string> {
  const immediate = (value: string): boolean => delay() <= 0 || value.trim().length < minLength();
  // Applies immediate terms synchronously and otherwise keeps the last applied term until the timeout below fires
  const applied = linkedSignal<{ value: string; immediate: boolean }, string>({
    source: () => {
      const value = term();
      return { value, immediate: immediate(value) };
    },
    computation: (current, previous) => (current.immediate || !previous ? current.value : previous.value),
  });
  // Read once so the initial term is applied before it can change
  untracked(applied);
  effect(
    (onCleanup) => {
      const value = term();
      if (!immediate(value)) {
        const timeout = setTimeout(() => applied.set(value), delay());
        onCleanup(() => clearTimeout(timeout));
      }
    },
    { injector },
  );
  return applied.asReadonly();
}
