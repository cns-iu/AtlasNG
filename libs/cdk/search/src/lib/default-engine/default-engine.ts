import { Service } from '@angular/core';
import type { SearchEngine } from '../engine/search-engine';
import { SearchFieldSpec } from '../engine/types';
import { DefaultSearchIndex } from './default-index';

/**
 * The built-in, dependency-free {@link SearchEngine}, injected as `SearchEngine` by default.
 *
 * Text is decomposed, stripped of diacritics, lowercased, and trimmed. The term is split into words and an item
 * matches when every word appears in at least one field. Results are ranked by {@link SearchMatchTier}: an exact
 * value, then a value prefix, then a word prefix, then any other occurrence. Ties keep the order of the items.
 *
 * Without fields, every string and number value (including arrays of them) of an item is searched, so the matched
 * items are a superset of those matched by a lowercase `includes` check.
 */
@Service()
export class DefaultSearchEngine implements SearchEngine {
  /**
   * Indexes a list of items.
   *
   * @param items Items to index.
   * @param fields Fields to search. Defaults to every string and number value of each item.
   * @returns A synchronous index of the items.
   */
  createIndex<T>(items: readonly T[], fields?: readonly SearchFieldSpec<T>[]): DefaultSearchIndex<T> {
    return new DefaultSearchIndex(items, fields);
  }
}
