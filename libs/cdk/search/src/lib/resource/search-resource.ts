import {
  computed,
  isSignal,
  Injector,
  Resource,
  resourceFromSnapshots,
  ResourceSnapshot,
  ResourceStatus,
  Signal,
  signal,
  untracked,
} from '@angular/core';
import { ConfigurationOf } from '@atlasng/core';
import { SearchEngine } from '../engine/search-engine';
import { SearchFieldDefinition, SearchFieldSpec, SearchResult, SearchSuggestion } from '../engine/types';
import { DEFAULT_SEARCH_VALUE_FIELD, isSearchPrimitive } from '../engine/values';
import { SEARCH_CONFIG } from '../providers';
import { debounceTerm } from './debounce-term';
import type { InjectSearchOptions, MaybeSignalLike } from './inject-search';
import { ContextualResponse, ResolvedResponse, resolveResponse } from './resolve-response';

/**
 * The search results of `injectSearch` as a read-only resource, with the suggestions as a resource of their own.
 *
 * `value` holds the results in the requested order: every item, without scores, when the term is too short. Like
 * every resource, `value` throws while the status is `'error'`; check `hasValue()` first or read {@link items}.
 */
export interface SearchResourceRef<T> extends Resource<readonly SearchResult<T>[]> {
  /** The items of the results; empty while the search is in an error state. */
  readonly items: Signal<readonly T[]>;
  /** Suggested values with their match ranges; empty when the term is too short or nothing can be suggested. */
  readonly suggestions: Resource<readonly SearchSuggestion[]>;
  /**
   * Searches again with the current term and options.
   *
   * @returns True if a reload was started, false if the resource has been destroyed.
   */
  reload(): boolean;
  /** Stops debouncing the term and resolving asynchronous responses. */
  destroy(): void;
}

/** Suggests string and number items themselves. Used when no suggestion field is given. */
const PRIMITIVE_SUGGESTION_FIELD: SearchFieldDefinition<unknown> = {
  name: DEFAULT_SEARCH_VALUE_FIELD,
  get: (item) => (isSearchPrimitive(item) ? item : undefined),
};

/**
 * The {@link SearchResourceRef} created by `injectSearch`.
 *
 * The index is rebuilt only when the items, fields, or engine change. Synchronous engines update the results
 * synchronously (after the debounce, if any). While an asynchronous request for a new term is pending, the previous
 * results are kept; when the items or other options changed, the results are empty until the request resolves.
 */
export class SearchResourceImpl<T> implements SearchResourceRef<T> {
  /** Results in the requested order. */
  readonly value: Signal<readonly SearchResult<T>[]>;

  /** Status of the search. */
  readonly status: Signal<ResourceStatus>;

  /** The error of the last failed asynchronous search, if any. */
  readonly error: Signal<Error | undefined>;

  /** True while an asynchronous search is pending. */
  readonly isLoading: Signal<boolean>;

  /** The status of the search together with its value or error. */
  readonly snapshot: Signal<ResourceSnapshot<readonly SearchResult<T>[]>>;

  /** The items of the results. */
  readonly items: Signal<readonly T[]>;

  /** Suggested values with their match ranges. */
  readonly suggestions: Resource<readonly SearchSuggestion[]>;

  /** Resource of the search results. */
  readonly #results: Resource<readonly SearchResult<T>[]>;

  /** Incremented by {@link reload} to query the engine again. */
  readonly #version = signal(0);

  /** Functions that release the effects and resources of this resource. */
  readonly #teardown: (() => void)[] = [];

  /** Whether {@link destroy} has been called. */
  #destroyed = false;

  /**
   * @param options Search options.
   * @param injector Injector for the engine, effects, and resources.
   * @param config Search defaults.
   */
  constructor(options: InjectSearchOptions<T>, injector: Injector, config: ConfigurationOf<typeof SEARCH_CONFIG>) {
    const items = toSignal(options.items);
    const fields = toSignal(options.fields);
    const limit = toSignal(options.limit);
    const order = toSignal(options.order);
    const suggestionField = toSignal(options.suggestionField);
    const engineOption = toSignal(options.engine);
    const engine = computed(() => engineOption() ?? injector.get(SearchEngine));
    const minLength = withDefault(options.minLength, config.minLength);
    const suggestionLimit = withDefault(options.suggestionLimit, config.suggestionLimit);
    const debounce = withDefault(options.debounce, config.debounce);
    const { term, effectRef } = debounceTerm(toSignal(options.term), debounce, minLength, injector);
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
        this.#version();
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
        this.#version();
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

    const results = this.#resource(searched);
    this.#results = results;
    this.value = results.value;
    this.status = results.status;
    this.error = results.error;
    this.isLoading = results.isLoading;
    this.snapshot = results.snapshot;
    this.items = computed(() => (results.hasValue() ? results.value().map((result) => result.item) : []));
    this.suggestions = this.#resource(suggested);
    this.#teardown.push(() => effectRef.destroy());
  }

  /**
   * Checks whether the search has results, which is the case unless it is in an error state.
   *
   * @returns True when `value` can be read.
   */
  hasValue(): this is SearchResourceRef<T> {
    return this.#results.hasValue();
  }

  /**
   * Searches again with the current term and options.
   *
   * @returns True if a reload was started, false if the resource has been destroyed.
   */
  reload(): boolean {
    if (this.#destroyed) {
      return false;
    }
    this.#version.update((version) => version + 1);
    return true;
  }

  /** Stops debouncing the term and resolving asynchronous responses. */
  destroy(): void {
    this.#destroyed = true;
    for (const teardown of this.#teardown.splice(0)) {
      teardown();
    }
  }

  /**
   * Creates a resource from a resolved response and registers its teardown.
   *
   * @param resolved Resolved response.
   * @returns A resource of the response.
   */
  #resource<V>(resolved: ResolvedResponse<V>): Resource<readonly V[]> {
    this.#teardown.push(() => resolved.destroy());
    return resourceFromSnapshots(resolved.snapshot);
  }
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
 * @param value An optional value, signal, or function.
 * @param fallback Value used while `value` is `undefined`.
 * @returns A signal of the value or the fallback.
 */
function withDefault<T>(value: MaybeSignalLike<T | undefined>, fallback: T): Signal<T> {
  const source = toSignal(value);
  return computed(() => source() ?? fallback);
}

/**
 * Wraps a value in a signal. Signals are returned as they are and other functions are wrapped in a computed signal.
 *
 * @param value A value, signal, or function.
 * @returns A signal of the value.
 */
function toSignal<T>(value: MaybeSignalLike<T>): Signal<T> {
  if (isSignal(value)) {
    return value as Signal<T>;
  }
  return typeof value === 'function' ? computed(value as () => T) : signal(value).asReadonly();
}
