import {
  assertInInjectionContext,
  computed,
  effect,
  inject,
  Injector,
  isSignal,
  linkedSignal,
  resource,
  runInInjectionContext,
  Signal,
  signal,
  untracked,
} from '@angular/core';
import { SEARCH_CONFIG, SEARCH_ENGINE } from './providers';
import { SearchEngine, SearchField, SearchResponse, SearchResult } from './types';

/** A value or a signal of a value. */
export type MaybeSignal<T> = T | Signal<T>;

/** Options for {@link injectSearch}. */
export interface InjectSearchOptions<T> {
  /** Items to search. The index is rebuilt when the items change. */
  items: MaybeSignal<readonly T[]>;
  /** Search term. */
  term: MaybeSignal<string>;
  /** Fields to search. The index is rebuilt when the fields change. Defaults to every string and number value. */
  fields?: MaybeSignal<readonly SearchField<T>[] | undefined>;
  /** Maximum number of results. Defaults to the configured `limit`. */
  limit?: MaybeSignal<number | undefined>;
  /** Milliseconds to wait after the term stops changing before searching. Defaults to the configured `debounce`. */
  debounce?: number;
  /** Minimum trimmed term length that triggers a search. Defaults to the configured `minLength`. */
  minLength?: number;
  /** Field whose values are suggested. Suggestions are disabled when omitted. */
  suggestionField?: MaybeSignal<SearchField<T> | undefined>;
  /** Maximum number of suggestions. Defaults to the configured `suggestionLimit`. */
  suggestionLimit?: number;
  /** Engine to use instead of the injected `SEARCH_ENGINE`. */
  engine?: SearchEngine;
  /** Injector used outside an injection context. */
  injector?: Injector;
}

/** Signals returned by {@link injectSearch}. */
export interface SearchRef<T> {
  /** Results ordered by relevance; every item, without scores, when the term is too short. */
  readonly results: Signal<readonly SearchResult<T>[]>;
  /** The items of {@link results}. */
  readonly items: Signal<readonly T[]>;
  /** Suggested values of the suggestion field; empty when the term is too short or suggestions are disabled. */
  readonly suggestions: Signal<readonly string[]>;
  /** True while an asynchronous search or suggestion request is pending. */
  readonly loading: Signal<boolean>;
  /** The error of the last failed asynchronous request, if any. */
  readonly error: Signal<unknown>;
}

/** The state of a response that may be asynchronous. */
interface ResolvedResponse<T> {
  /** The latest resolved value. Keeps the previous value while a request is pending. */
  readonly value: Signal<readonly T[]>;
  /** True while a request is pending. */
  readonly loading: Signal<boolean>;
  /** The error of the last failed request. */
  readonly error: Signal<unknown>;
}

/**
 * Searches a list of items with the injected `SEARCH_ENGINE` and exposes the results as signals. Must be called in an
 * injection context unless an injector is provided.
 *
 * The index is rebuilt only when the items or fields change. Synchronous engines update the results synchronously
 * (after the debounce, if any); asynchronous engines keep the previous results while a request is pending.
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
  const engine = options.engine ?? injector.get(SEARCH_ENGINE);
  const minLength = options.minLength ?? config.minLength;
  const suggestionLimit = options.suggestionLimit ?? config.suggestionLimit;

  const items = toSignal(options.items);
  const fields = toSignal(options.fields);
  const limit = toSignal(options.limit);
  const suggestionField = toSignal(options.suggestionField);
  const term = debounceTerm(toSignal(options.term), options.debounce ?? config.debounce, minLength, injector);
  const active = computed(() => term().trim().length >= minLength && term().trim().length > 0);

  const index = computed(() => {
    const currentItems = items();
    const currentFields = fields();
    return untracked(() => engine.createIndex(currentItems, currentFields));
  });
  const suggestionIndex = computed(() => {
    const field = suggestionField();
    const currentItems = items();
    return field === undefined ? undefined : untracked(() => engine.createIndex(currentItems, [field]));
  });

  const searched = resolveResponse(
    computed(() => {
      if (!active()) {
        return items().map((item): SearchResult<T> => ({ item }));
      }
      const currentIndex = index();
      const query = { term: term(), limit: limit() ?? config.limit };
      return untracked(() => currentIndex.search(query));
    }),
    injector,
  );

  const suggested = resolveResponse(
    computed(() => {
      const currentIndex = suggestionIndex();
      if (!active() || !currentIndex?.suggest) {
        return [];
      }
      const currentTerm = term();
      return untracked(() => currentIndex.suggest?.(currentTerm, suggestionLimit) ?? []);
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
 * Wraps a value in a signal unless it already is one.
 *
 * @param value A value or signal.
 * @returns A signal of the value.
 */
function toSignal<T>(value: MaybeSignal<T>): Signal<T> {
  return isSignal(value) ? value : signal(value).asReadonly();
}

/**
 * Debounces a search term. Terms shorter than the minimum length, such as a cleared term, apply immediately.
 *
 * @param term Search term.
 * @param delay Debounce in milliseconds; `0` or less disables debouncing.
 * @param minLength Minimum trimmed term length that triggers a search.
 * @param injector Injector for the debounce effect.
 * @returns The debounced term.
 */
function debounceTerm(term: Signal<string>, delay: number, minLength: number, injector: Injector): Signal<string> {
  if (delay <= 0) {
    return term;
  }

  const debounced = signal(untracked(term));
  effect(
    (onCleanup) => {
      const value = term();
      if (value.trim().length < minLength) {
        debounced.set(value);
        return;
      }
      const timeout = setTimeout(() => debounced.set(value), delay);
      onCleanup(() => clearTimeout(timeout));
    },
    { injector },
  );
  return debounced.asReadonly();
}

/**
 * Resolves a response that may be synchronous or asynchronous. Synchronous values pass through immediately;
 * promises are resolved with a resource, which ignores stale responses.
 *
 * @param response Signal of the latest response.
 * @param injector Injector for the resource.
 * @returns The resolved value, loading state, and error.
 */
function resolveResponse<T>(response: Signal<SearchResponse<T>>, injector: Injector): ResolvedResponse<T> {
  const pending = computed(() => {
    const value = response();
    return isPromiseLike(value) ? { promise: value } : undefined;
  });
  const request = resource({
    params: pending,
    loader: ({ params }) => Promise.resolve(params.promise),
    injector,
  });
  const failed = computed(() => pending() !== undefined && request.status() === 'error');

  const value = linkedSignal<readonly T[] | undefined, readonly T[]>({
    source: () => {
      const current = response();
      if (!isPromiseLike(current)) {
        return current;
      } else if (failed()) {
        return [];
      }
      return request.hasValue() ? request.value() : undefined;
    },
    computation: (current, previous) => current ?? previous?.value ?? [],
  });

  return {
    value: value.asReadonly(),
    loading: computed(() => pending() !== undefined && request.isLoading()),
    error: computed(() => (failed() ? request.error() : undefined)),
  };
}

/**
 * Checks whether a value is a promise-like object.
 *
 * @param value Value to check.
 * @returns True when the value has a `then` method.
 */
function isPromiseLike<T>(value: SearchResponse<T>): value is PromiseLike<readonly T[]> {
  return typeof (value as Partial<PromiseLike<unknown>>).then === 'function';
}
