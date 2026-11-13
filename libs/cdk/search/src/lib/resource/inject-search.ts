import { assertInInjectionContext, inject, Injector, Signal } from '@angular/core';
import { SearchEngine } from '../engine/search-engine';
import { SearchFieldSpec, SearchFilter, SearchOrder } from '../engine/types';
import { SEARCH_CONFIG } from '../providers';
import { SearchResourceImpl, SearchResourceRef } from './search-resource';

/**
 * A value, or a signal or other function that returns it. Functions are read in a reactive context, so signals they
 * read are tracked.
 */
export type MaybeSignalLike<T> = T | (() => T);

/**
 * A signal or zero-argument function that returns a value. Unlike {@link MaybeSignalLike}, the value cannot be passed
 * directly, which keeps values that are functions themselves apart from the functions that return them.
 */
export type SignalLike<T> = Signal<T> | (() => T);

/**
 * Options for {@link injectSearch}. Every option accepts a signal or function and is read reactively, so options can come from
 * component inputs even though `injectSearch` runs in a field initializer, before the inputs are set.
 */
export interface InjectSearchOptions<T> {
  /** Items to search. The index is rebuilt when the items change. */
  items: MaybeSignalLike<readonly T[]>;
  /** Search term. */
  term: MaybeSignalLike<string>;
  /** Fields to search. The index is rebuilt when the fields change. Defaults to every string and number value. */
  fields?: MaybeSignalLike<readonly SearchFieldSpec<T>[] | undefined>;
  /**
   * Only items for which the predicate returns true are searched, returned for an empty or too short term, and
   * suggested. A change is applied without rebuilding the index.
   *
   * Every function option is called without arguments to read its value, so a predicate cannot be passed directly:
   * pass a signal of the predicate or a function that returns it, such as `filter: () => (item) => item.visible`.
   * Return the same predicate while the filter is unchanged, because a new one runs the search again.
   */
  filter?: SignalLike<SearchFilter<T> | undefined>;
  /** Maximum number of results, applied after the filter. Defaults to no limit. */
  limit?: MaybeSignalLike<number | undefined>;
  /** Order of the results. Defaults to `'rank'`; `'source'` keeps the order of the items. */
  order?: MaybeSignalLike<SearchOrder | undefined>;
  /** Milliseconds to wait after the term stops changing before searching. Defaults to the configured `debounce`. */
  debounce?: MaybeSignalLike<number | undefined>;
  /** Minimum trimmed term length that triggers a search. Defaults to the configured `minLength`. */
  minLength?: MaybeSignalLike<number | undefined>;
  /**
   * Field whose values are suggested. When omitted, string and number items are suggested themselves and other items
   * produce no suggestions.
   */
  suggestionField?: MaybeSignalLike<SearchFieldSpec<T> | undefined>;
  /** Maximum number of suggestions. Defaults to the configured `suggestionLimit`. */
  suggestionLimit?: MaybeSignalLike<number | undefined>;
  /** Engine to use instead of the injected {@link SearchEngine}. */
  engine?: MaybeSignalLike<SearchEngine | undefined>;
  /** Injector used outside an injection context. */
  injector?: Injector;
}

/**
 * Searches a list of items with the injected {@link SearchEngine} and exposes the results as a resource. Must be
 * called in an injection context unless an injector is provided.
 *
 * The index is rebuilt only when the items, fields, or engine change; the filter is applied per search. Synchronous engines update the results
 * synchronously (after the debounce, if any). While an asynchronous request for a new term is pending, the previous
 * results are kept; when the items or other options changed, the results are empty until the request resolves.
 *
 * @param options Search options.
 * @returns A resource of the results, with the matched items and a resource of the suggestions.
 * @example
 * readonly term = signal('');
 * readonly search = injectSearch({ items: this.options, term: this.term, fields: ['label', 'description'] });
 */
export function injectSearch<T>(options: InjectSearchOptions<T>): SearchResourceRef<T> {
  if (!options.injector) {
    assertInInjectionContext(injectSearch);
  }
  const injector = options.injector ?? inject(Injector);
  const config = SEARCH_CONFIG.inject({ injector });

  return new SearchResourceImpl(options, injector, config);
}
