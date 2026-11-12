import type { Provider } from '@angular/core';
import { createConfigurationToken, type } from '@atlasng/core';

/**
 * Setup of the knowledge graph explorer metadata view. Every option is
 * optional; omitted options fall back to {@link KG_EXPLORER_METADATA_VIEW_CONFIG}
 * and then to the built-in defaults.
 */
export interface KgExplorerMetadataViewConfig {
  /** Heading of the version control panel. Defaults to `'Digital object version'`. */
  versionControlTagline?: string;
  /** Heading level of the section titles. Defaults to `2`. */
  sectionHeadingLevel?: number;
  /** Hides the divider beneath each section title. Defaults to `false`. */
  sectionDividersDisabled?: boolean;
}

/**
 * Configuration token for {@link KgExplorerMetadataViewConfig}, provided by
 * {@link provideKgExplorerMetadataView}. A provided configuration is merged
 * over the configuration of its parent injector, and the `config` input of a
 * metadata view is merged over both.
 */
export const KG_EXPLORER_METADATA_VIEW_CONFIG = createConfigurationToken({
  name: 'KG_EXPLORER_METADATA_VIEW_CONFIG',
  config: type<KgExplorerMetadataViewConfig>(),
  defaults: () => ({
    versionControlTagline: 'Digital object version',
    sectionHeadingLevel: 2,
    sectionDividersDisabled: false,
  }),
  inherit: true,
});

/**
 * Provides defaults for every knowledge graph explorer metadata view below
 * the injector, for example in the application or route providers.
 *
 * @param config Options to set; omitted options keep the value of the parent injector or the built-in default.
 * @returns A provider for {@link KG_EXPLORER_METADATA_VIEW_CONFIG}.
 */
export function provideKgExplorerMetadataView(config: KgExplorerMetadataViewConfig): Provider {
  return KG_EXPLORER_METADATA_VIEW_CONFIG.provide(config);
}
