export {
  DEFAULT_SEARCH_VALUE_FIELD,
  DefaultSearchEngine,
  DefaultSearchIndex,
  SearchMatchTier,
} from './lib/default-engine';
export {
  highlightSegments,
  SEARCH_HIGHLIGHT_MATCH_CLASS,
  SearchHighlight,
  type HighlightSegment,
} from './lib/highlight';
export { injectSearch, type InjectSearchOptions, type MaybeSignal, type SearchRef } from './lib/inject-search';
export { normalizeSearchText } from './lib/normalize';
export {
  provideSearch,
  SEARCH_CONFIG,
  SEARCH_ENGINE,
  SearchFeatureKind,
  withCustomEngine,
  withSearchConfig,
  type SearchConfig,
  type SearchFeature,
} from './lib/providers';
export type {
  SearchEngine,
  SearchFieldDefinition,
  SearchFieldName,
  SearchFieldSpec,
  SearchFieldValue,
  SearchIndex,
  SearchKey,
  SearchMatch,
  SearchOrder,
  SearchPrimitive,
  SearchQuery,
  SearchRange,
  SearchResponse,
  SearchResult,
  SearchSuggestion,
} from './lib/types';
