export { DefaultSearchEngine } from './lib/default-engine/default-engine';
export { DefaultSearchIndex } from './lib/default-engine/default-index';
export { SearchMatchTier } from './lib/default-engine/matching';
export {
  highlightSegments,
  SEARCH_HIGHLIGHT_MATCH_CLASS,
  SearchHighlight,
  type HighlightSegment,
} from './lib/highlight/highlight';
export { injectSearch, type InjectSearchOptions, type MaybeSignal, type SearchRef } from './lib/resource/inject-search';
export { DEFAULT_SEARCH_VALUE_FIELD } from './lib/engine/values';
export { normalizeSearchText } from './lib/text/normalize';
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
} from './lib/engine/types';
