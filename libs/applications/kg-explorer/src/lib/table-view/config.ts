import type { Provider } from '@angular/core';
import type { SearchFieldDefinition, SearchFieldSpec } from '@atlasng/cdk/search';
import { createConfigurationToken, type } from '@atlasng/core';
import type { Row } from '@atlasng/design-system/table';
import type { VersionControlFileFormat } from '@atlasng/design-system/version-control';
import type { KgExplorerDownloadFormats } from '../download-cell/download-cell';

/**
 * Setup of the knowledge graph explorer table view. Every option is optional;
 * omitted options fall back to {@link KG_EXPLORER_TABLE_VIEW_CONFIG} and then
 * to the built-in defaults.
 */
export interface KgExplorerTableViewConfig<
  TRow extends Row = Row,
  TFormat extends VersionControlFileFormat = VersionControlFileFormat,
> {
  /** Fields to search. Defaults to every string, number, and array of strings or numbers of a row. */
  searchFields?: readonly SearchFieldSpec<TRow>[];
  /** Field whose values are suggested below the search field. Defaults to the row's `title`. */
  searchSuggestionField?: SearchFieldSpec<TRow>;
  /** Disables the autocomplete suggestions of the search field. Defaults to `false`. */
  searchSuggestionsDisabled?: boolean;
  /** Hides the search field. Defaults to `false`. */
  searchDisabled?: boolean;
  /** Hides the "Viewing X of Y" results counter. Defaults to `false`. */
  resultsCounterDisabled?: boolean;
  /** Hides the end-of-results indicator below the table. Defaults to `false`. */
  endOfResultsDisabled?: boolean;
  /**
   * File formats each row can be downloaded in: the same formats for every
   * row, or a function returning the formats of a row. The download column is
   * only shown when this is set.
   */
  downloadFormats?: KgExplorerDownloadFormats<TRow, TFormat>;
}

/** Suggests the `title` of each row when it is a string. */
const TITLE_SUGGESTION_FIELD: SearchFieldDefinition<Row> = {
  name: 'title',
  get: (row) => {
    const title: unknown = row['title'];
    return typeof title === 'string' ? title : undefined;
  },
};

/**
 * Configuration token for {@link KgExplorerTableViewConfig}, provided by
 * {@link provideKgExplorerTableView}. A provided configuration is merged over
 * the configuration of its parent injector, and the `config` input of a table
 * view is merged over both.
 */
export const KG_EXPLORER_TABLE_VIEW_CONFIG = createConfigurationToken({
  name: 'KG_EXPLORER_TABLE_VIEW_CONFIG',
  config: type<KgExplorerTableViewConfig>(),
  defaults: () => ({
    searchSuggestionField: TITLE_SUGGESTION_FIELD,
    searchSuggestionsDisabled: false,
    searchDisabled: false,
    resultsCounterDisabled: false,
    endOfResultsDisabled: false,
  }),
  inherit: true,
});

/**
 * Provides defaults for every knowledge graph explorer table view below the
 * injector, for example in the application or route providers.
 *
 * @param config Options to set; omitted options keep the value of the parent injector or the built-in default.
 * @returns A provider for {@link KG_EXPLORER_TABLE_VIEW_CONFIG}.
 */
export function provideKgExplorerTableView(config: KgExplorerTableViewConfig): Provider {
  return KG_EXPLORER_TABLE_VIEW_CONFIG.provide(config);
}
