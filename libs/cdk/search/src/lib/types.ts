/** A half-open `[start, end)` range of UTF-16 offsets into a string. */
export type SearchRange = readonly [start: number, end: number];

/** A primitive value that can be searched. Other values are ignored. */
export type SearchPrimitive = string | number;

/** Values returned by a {@link SearchFieldDefinition} getter. `null`, `undefined`, and other values are ignored. */
export type SearchFieldValue = SearchPrimitive | null | undefined | readonly (SearchPrimitive | null | undefined)[];

/** String keys of an item type. Resolves to `never` for primitive item types. */
export type SearchKey<T> = T extends object ? Extract<keyof T, string> : never;

/** A computed field searched by a {@link SearchEngine}. */
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
 * A field searched by a {@link SearchEngine}: either a key of the item or a computed field. When no fields are given,
 * engines search every string, number, and array of strings or numbers of an item, or the item itself if it is a
 * string or number.
 */
export type SearchField<T> = SearchKey<T> | SearchFieldDefinition<T>;

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
}

/** An item matched by a search. */
export interface SearchResult<T> {
  /** The matched item. */
  readonly item: T;
  /** Relevance score; higher is better. Omitted when the term is empty. */
  readonly score?: number;
  /** Matched values with their ranges. Omitted when the term is empty. */
  readonly matches?: readonly SearchMatch[];
}

/** A search request. */
export interface SearchQuery<T> {
  /** Search term. An empty term matches every item. */
  readonly term: string;
  /** Restricts the search to these indexed field names. Defaults to every indexed field. */
  readonly fields?: readonly SearchFieldName<T>[];
  /** Maximum number of results. Defaults to no limit. */
  readonly limit?: number;
}

/** Search results, returned synchronously or asynchronously. */
export type SearchResponse<T> = readonly T[] | PromiseLike<readonly T[]>;

/** A searchable collection created by {@link SearchEngine.createIndex}. */
export interface SearchIndex<T> {
  /**
   * Searches the indexed items.
   *
   * @param query Search request.
   * @returns Matching results ordered by relevance, synchronously or as a promise.
   */
  search(query: SearchQuery<T>): SearchResponse<SearchResult<T>>;
  /**
   * Suggests unique values of the indexed fields that match a term, for autocomplete.
   *
   * @param term Search term.
   * @param limit Maximum number of suggestions.
   * @returns Suggested values ordered by relevance, synchronously or as a promise.
   */
  suggest?(term: string, limit?: number): SearchResponse<string>;
}

/** Creates search indexes. Provide a custom engine with `withCustomEngine` to swap the search implementation. */
export interface SearchEngine {
  /**
   * Indexes a list of items.
   *
   * @param items Items to index.
   * @param fields Fields to search. Defaults to every string and number value of each item.
   * @returns An index of the items.
   */
  createIndex<T>(items: readonly T[], fields?: readonly SearchField<T>[]): SearchIndex<T>;
}
