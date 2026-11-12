import { inject, Service } from '@angular/core';
import { DefaultSearchEngine } from '../default-engine/default-engine';
import { SearchFieldSpec, SearchIndex } from './types';

/**
 * Creates search indexes. Injecting `SearchEngine` yields the {@link DefaultSearchEngine} unless another engine is
 * provided with `provideSearch` and `withCustomEngine`.
 */
@Service({ factory: () => inject(DefaultSearchEngine) })
export abstract class SearchEngine {
  /**
   * Indexes a list of items.
   *
   * @param items Items to index.
   * @param fields Fields to search. Defaults to every string and number value of each item.
   * @returns An index of the items.
   */
  abstract createIndex<T>(items: readonly T[], fields?: readonly SearchFieldSpec<T>[]): SearchIndex<T>;
}
