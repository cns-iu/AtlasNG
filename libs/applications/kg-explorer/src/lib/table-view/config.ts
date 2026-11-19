import type { Provider } from '@angular/core';
import type { BreakpointExpression } from '@atlasng/cdk';
import type { SearchFieldDefinition, SearchFieldSpec } from '@atlasng/cdk/search';
import { createConfigurationToken, type } from '@atlasng/core';
import type { BreadcrumbItem } from '@atlasng/design-system/buttons/breadcrumbs';
import type { Row } from '@atlasng/design-system/table';
import type { VersionControlFileFormat } from '@atlasng/design-system/version-control';
import type { KgExplorerDownloadFormats } from '../download-cell/download-cell';
import type { KgExplorerViewOption, KgExplorerViewSetting } from '../models';

/** Content and labels of the filter drawer of the knowledge graph explorer table view. */
export interface KgExplorerFilterDrawerConfig {
  /** Breadcrumb trail shown at the top of the filter drawer. Hidden when empty. */
  breadcrumbs?: BreadcrumbItem[];
  /** Heading shown at the top of the filter drawer, below the breadcrumbs. */
  filtersHeading?: string;
  /** Supporting text shown below the filter drawer heading. */
  filtersDescription?: string;
  /**
   * Options of the view button toggle in the "Customize view" section of the filter drawer. The section is shown
   * only when this or {@link viewSettings} has entries.
   */
  viewToggleOptions?: KgExplorerViewOption[];
  /** Selects shown in the "Customize view" section, such as "View as", "Sort by" or "Group by". */
  viewSettings?: KgExplorerViewSetting[];
  /** Heading of the filters section of the filter drawer. Defaults to "Filters". */
  filtersLabel?: string;
  /** Label of the button that clears every filter selection. Defaults to "Clear filters". */
  clearFiltersLabel?: string;
  /** Heading of the view customization section of the filter drawer. Defaults to "Customize view". */
  customizeViewLabel?: string;
  /** Label of the button that resets the view customizations. Defaults to "Reset". */
  resetViewLabel?: string;
  /** Accessible name of the view options button toggle group. Defaults to "View". */
  viewOptionsLabel?: string;
}

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
  disableSearchSuggestions?: boolean;
  /** Hides the search field. Defaults to `false`. */
  disableSearch?: boolean;
  /** Label of the search field. Defaults to "Search". */
  searchLabel?: string;
  /** Accessible name of the results table. Defaults to "Results". */
  tableLabel?: string;
  /** Hides the "Viewing X of Y" results counter. Defaults to `false`. */
  disableResultsCounter?: boolean;
  /** Text before the numbers of the results counter. Defaults to `Viewing`. */
  resultsCounterPrefix?: string;
  /** Hides the end-of-results indicator below the table. Defaults to `false`. */
  disableEndOfResults?: boolean;
  /**
   * File formats each row can be downloaded in: the same formats for every
   * row, or a function returning the formats of a row. The download column is
   * only shown when this is set.
   */
  downloadFormats?: KgExplorerDownloadFormats<TRow, TFormat>;
  /** Accessible name of the download column's header, which is visually empty. Defaults to `Download`. */
  downloadColumnLabel?: string;
  /**
   * Names the row of each download button: a row key or a function returning
   * the name, announced as "Download CSV for <name>", "Choose download format
   * for <name>", or "No downloads available for <name>". Defaults to the row's `title`.
   */
  downloadLabel?: (keyof TRow & string) | ((row: TRow) => string);
  /**
   * Breakpoint expression, as accepted by `watchBreakpoint` from `@atlasng/cdk`,
   * from which the filter menu is docked beside the table instead of opening as
   * a drawer. Defaults to `'large'` (1280px).
   */
  filtersDockBreakpoint?: BreakpointExpression;
  /** Content and labels of the filter drawer. Merged over the provided `filterOptions`. */
  filterOptions?: KgExplorerFilterDrawerConfig;
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
    disableSearchSuggestions: false,
    disableSearch: false,
    disableResultsCounter: false,
    resultsCounterPrefix: 'Viewing',
    disableEndOfResults: false,
    filtersDockBreakpoint: 'large',
    filterOptions: {
      filtersLabel: 'Filters',
      clearFiltersLabel: 'Clear filters',
      customizeViewLabel: 'Customize view',
      resetViewLabel: 'Reset',
      viewOptionsLabel: 'View',
    },
    downloadColumnLabel: 'Download',
    downloadLabel: 'title',
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
