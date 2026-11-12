/** A half-open `[start, end)` range of UTF-16 offsets into a string. */
export type SearchRange = readonly [start: number, end: number];

/** A primitive value that can be searched. Other values are ignored. */
export type SearchPrimitive = string | number;

/** Values returned by a {@link SearchFieldDefinition} getter. `null`, `undefined`, and other values are ignored. */
export type SearchFieldValue = SearchPrimitive | null | undefined | readonly (SearchPrimitive | null | undefined)[];

/**
 * String keys of an item type. Kept non-conditional so a key such as `'label'` type-checks inside a generic component
 * whose item type is only constrained (`T extends { label: string }`). Engines ignore keys whose values are not
 * searchable at runtime.
 */
export type SearchKey<T> = keyof T & string;

/** A computed field searched by a `SearchEngine`. */
export interface SearchFieldDefinition<T> {
  /** Field name, reported in {@link SearchMatch.field} and used by {@link SearchQuery.fields}. */
  readonly name: string;
  /**
   * Reads the searchable value or values of an item.
   *
   * @param item Item to read.
   * @returns A string, number, or list of strings and numbers.
   */
  get(item: T): SearchFieldValue;
  /** Multiplies the score of matches in this field. Defaults to `1`. */
  readonly weight?: number;
}

/**
 * A field searched by a `SearchEngine`: either a key of the item or a computed field. When no fields are given,
 * engines search every string, number, and array of strings or numbers of an item, or the item itself if it is a
 * string or number.
 */
export type SearchFieldSpec<T> = SearchKey<T> | SearchFieldDefinition<T>;

/** Name of a searched field. */
export type SearchFieldName<T> = SearchKey<T> | (string & {});

/** Match ranges within one value of a field. */
export interface SearchMatch {
  /** Name of the matched field. */
  readonly field: string;
  /** The original, unnormalized value that {@link ranges} index into. */
  readonly value: string;
  /** Sorted, non-overlapping ranges of {@link value} that matched the term. */
  readonly ranges: readonly SearchRange[];
  /** Position of {@link value} in the field value when the field value is an array. */
  readonly index?: number;
}

/** A suggested value with the ranges that matched the term. */
export interface SearchSuggestion {
  /** The original, unnormalized value. */
  readonly value: string;
  /** Sorted, non-overlapping ranges of {@link value} that matched the term. */
  readonly ranges: readonly SearchRange[];
}

/** Order of search results: by relevance (`'rank'`) or in the order of the indexed items (`'source'`). */
export type SearchOrder = 'rank' | 'source';

/** An item matched by a search. */
export interface SearchResult<T> {
  /** The matched item. */
  readonly item: T;
  /** Relevance score; higher is better. Omitted when the term is empty. */
  readonly score?: number;
  /** Matched values with their ranges. Omitted when the term is empty. */
  readonly matches?: readonly SearchMatch[];
}

/**
 * Decides whether an item can be matched or suggested.
 *
 * @param item Item to test.
 * @returns True to keep the item.
 */
export type SearchFilter<T> = (item: T) => boolean;

/** A search request. */
export interface SearchQuery<T> {
  /** Search term. An empty term matches every item. */
  readonly term: string;
  /** Restricts the search to these indexed field names. Defaults to every indexed field. */
  readonly fields?: readonly SearchFieldName<T>[];
  /**
   * Only items for which this returns true can match. Applied before ordering and {@link limit}, so filtering does
   * not require a new index. Engines must honour it.
   */
  readonly filter?: SearchFilter<T>;
  /** Maximum number of results. Defaults to no limit. Applied after filtering and ordering. */
  readonly limit?: number;
  /** Order of the results. Defaults to `'rank'`. */
  readonly order?: SearchOrder;
}

/** Search results, returned synchronously or asynchronously. */
export type SearchResponse<T> = readonly T[] | PromiseLike<readonly T[]>;

/**
 * A searchable collection created by `SearchEngine.createIndex`. Implementations must honour the item filter of
 * {@link SearchQuery.filter} and {@link SearchIndex.suggest}.
 */
export interface SearchIndex<T> {
  /**
   * Searches the indexed items.
   *
   * @param query Search request.
   * @returns Matching results in the query order, synchronously or as a promise.
   */
  search(query: SearchQuery<T>): SearchResponse<SearchResult<T>>;
  /**
   * Suggests unique values of the indexed fields that match a term, for autocomplete.
   *
   * @param term Search term.
   * @param limit Maximum number of suggestions. Applied after filtering.
   * @param filter Only values of items for which this returns true are suggested.
   * @returns Suggested values with their match ranges, ordered by relevance, synchronously or as a promise.
   */
  suggest?(term: string, limit?: number, filter?: SearchFilter<T>): SearchResponse<SearchSuggestion>;
}
