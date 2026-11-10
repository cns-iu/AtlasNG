import { inject, InjectionToken, Provider } from '@angular/core';
import { CdkErrorCode } from '@atlasng/cdk/errors';
import { AngError, createConfigurationToken, type } from '@atlasng/core';
import { DefaultSearchEngine } from './default-engine';
import { SearchEngine } from './types';

/** Search defaults used by `injectSearch`. */
export interface SearchConfig {
  /** Milliseconds to wait after the term stops changing before searching. Defaults to `0` (no debounce). */
  debounce?: number;
  /** Minimum trimmed term length that triggers a search; shorter terms return every item. Defaults to `1`. */
  minLength?: number;
  /** Maximum number of results. Defaults to no limit. */
  limit?: number;
  /** Maximum number of suggestions. Defaults to `10`. */
  suggestionLimit?: number;
}

/** Search engine used by `injectSearch`. Defaults to {@link DefaultSearchEngine}. */
export const SEARCH_ENGINE = new InjectionToken<SearchEngine>('SEARCH_ENGINE', {
  providedIn: 'root',
  factory: () => inject(DefaultSearchEngine),
});

/** Configuration token for {@link SearchConfig}. Provided by {@link withSearchConfig}. */
export const SEARCH_CONFIG = createConfigurationToken({
  name: 'SEARCH_CONFIG',
  config: type<SearchConfig>(),
  defaults: () => ({ debounce: 0, minLength: 1, suggestionLimit: 10 }),
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
  /** Configuration added with {@link withSearchConfig}. */
  Configuration,
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
    providers: [{ provide: SEARCH_ENGINE, useFactory: engineFactory }],
  };
}

/**
 * Sets search defaults. The configuration is merged over any configuration provided by a parent injector, so a
 * component or route only needs to set the options it changes.
 *
 * @param config Search defaults.
 * @returns The configuration feature.
 */
export function withSearchConfig(config: SearchConfig): SearchFeature {
  return {
    kind: SearchFeatureKind.Configuration,
    providers: [
      {
        provide: SEARCH_CONFIG.token,
        useFactory: (): SearchConfig => ({
          ...inject(SEARCH_CONFIG.token, { optional: true, skipSelf: true }),
          ...withoutUndefined(config),
        }),
      },
    ],
  };
}

/**
 * Configures search. Returns plain providers so it can be used in application, route, and component providers; a
 * nested provider overrides the engine and merges its configuration over its parent's.
 *
 * @param features Search features.
 * @returns Providers for the features.
 * @throws AngError in dev mode if more than one custom engine is provided.
 * @example
 * providers: [provideSearch(withCustomEngine(() => new RemoteSearchEngine()), withSearchConfig({ debounce: 300 }))]
 */
export function provideSearch(...features: SearchFeature[]): Provider[] {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    const engines = features.filter((feature) => feature.kind === SearchFeatureKind.CustomEngine);
    if (engines.length > 1) {
      throw new AngError(
        CdkErrorCode.MultipleSearchEngines,
        'Multiple custom search engines were provided. Please provide only one custom engine.',
      );
    }
  }

  return features.flatMap((feature) => feature.providers);
}

/**
 * Removes properties whose value is `undefined`, so they do not override a parent configuration.
 *
 * @param config Configuration to filter.
 * @returns The configuration without undefined properties.
 */
function withoutUndefined(config: SearchConfig): SearchConfig {
  return Object.fromEntries(Object.entries(config).filter(([, value]) => value !== undefined));
}
