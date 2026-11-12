import { Provider } from '@angular/core';
import { CdkErrorCode } from '@atlasng/cdk/errors';
import { AngError, createConfigurationToken, type } from '@atlasng/core';
import { DefaultSearchEngine } from './default-engine/default-engine';
import { SearchEngine } from './engine/search-engine';

/**
 * Search defaults used by `injectSearch`. There is deliberately no result limit: a global limit would silently
 * truncate filter lists, so limits are set per call.
 */
export interface SearchConfig {
  /** Milliseconds to wait after the term stops changing before searching. Defaults to `0` (no debounce). */
  debounce?: number;
  /** Minimum trimmed term length that triggers a search; shorter terms return every item. Defaults to `1`. */
  minLength?: number;
  /** Maximum number of suggestions. Defaults to `10`. */
  suggestionLimit?: number;
}

/**
 * Configuration token for {@link SearchConfig}. Provided by {@link provideSearch}. A provided configuration is merged
 * over the configuration of its parent injector.
 */
export const SEARCH_CONFIG = createConfigurationToken({
  name: 'SEARCH_CONFIG',
  config: type<SearchConfig>(),
  defaults: () => ({ debounce: 0, minLength: 1, suggestionLimit: 10 }),
  inherit: true,
});

/** A feature passed to {@link provideSearch}. */
export interface SearchFeature {
  /** The kind of the feature. */
  kind: SearchFeatureKind;
  /** The providers of the feature. */
  providers: Provider[];
}

/** The kinds of features accepted by {@link provideSearch}. */
export enum SearchFeatureKind {
  /** A custom engine added with {@link withCustomEngine}. */
  CustomEngine,
  /** The default engine selected with {@link withDefaultEngine}. */
  DefaultEngine,
}

/**
 * Replaces the search engine.
 *
 * @param engineFactory Factory that creates the engine. Runs in an injection context.
 * @returns The custom engine feature.
 */
export function withCustomEngine(engineFactory: () => SearchEngine): SearchFeature {
  return {
    kind: SearchFeatureKind.CustomEngine,
    providers: [{ provide: SearchEngine, useFactory: engineFactory }],
  };
}

/**
 * Explicitly selects the {@link DefaultSearchEngine}. The default engine is used when no engine is provided, so this
 * is only needed to restore it below an injector that provides a custom engine.
 *
 * @returns The default engine feature.
 */
export function withDefaultEngine(): SearchFeature {
  return {
    kind: SearchFeatureKind.DefaultEngine,
    providers: [{ provide: SearchEngine, useExisting: DefaultSearchEngine }],
  };
}

/**
 * Configures search. Returns plain providers so it can be used in application, route, and component providers; a
 * nested provider overrides the engine and merges its configuration over its parent's.
 *
 * @param config Search defaults. Only the options that are set override those of a parent injector.
 * @param features Search features.
 * @returns Providers for the configuration and features.
 * @throws AngError in dev mode if more than one engine is provided.
 * @example
 * providers: [provideSearch({ debounce: 300 }, withCustomEngine(() => new RemoteSearchEngine()))]
 */
export function provideSearch(config?: SearchConfig, ...features: SearchFeature[]): Provider[] {
  checkEngineConfiguration(features);

  return [...(config ? [SEARCH_CONFIG.provide(config)] : []), ...features.flatMap((feature) => feature.providers)];
}

/**
 * Validates that at most one engine is configured. Only runs in dev mode.
 *
 * @param features Features passed to {@link provideSearch}.
 * @throws AngError when more than one engine feature is present.
 */
function checkEngineConfiguration(features: SearchFeature[]): void {
  if (!(typeof ngDevMode === 'undefined' || ngDevMode)) {
    return;
  }

  const kinds = [SearchFeatureKind.CustomEngine, SearchFeatureKind.DefaultEngine];
  const engines = features.filter((feature) => kinds.includes(feature.kind));

  if (engines.length > 1) {
    throw new AngError(
      CdkErrorCode.MultipleSearchEngines,
      'Multiple search engines were provided. Please provide only one engine.',
    );
  }
}
