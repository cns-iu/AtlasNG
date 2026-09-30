import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import { Promisable } from 'type-fest';
import { ContentComponentDefinition } from '../types/content-component-definition';
import { ContentDataLoaderRegistry } from './data-loader-registry';
import { ContentDataParserRegistry } from './data-parser-registry';
import { ContentDefinitionRegistry } from './definition-registry';
import {
  CONTENT_COMPONENT_DEFINITIONS,
  CONTENT_DATA_LOADER_CONFIG,
  CONTENT_DATA_LOADERS,
  CONTENT_DATA_PARSERS,
  ContentDataLoaderConfig,
  ContentDataLoaderFactory,
  ContentDataParserFactory,
} from './tokens';

/** Provider bundle returned by content-templates feature helpers. */
export interface ContentTemplatesFeature {
  /** Feature discriminator. */
  kind: ContentTemplatesFeatureKind;
  /** Providers contributed by the feature. */
  providers: Provider[];
}

/** Content-templates feature variants supported by {@link provideContentTemplates}. */
export enum ContentTemplatesFeatureKind {
  /** Feature registering eagerly available component definitions. */
  Definitions,
  /** Feature registering lazily loaded component definitions. */
  LazyDefinitions,
  /** Feature registering data loaders. */
  DataLoaders,
  /** Feature registering data parsers. */
  DataParsers,
}

/**
 * Registers component definitions under their `name`.
 *
 * @param definitions Definitions to register.
 * @returns Feature consumed by {@link provideContentTemplates}.
 */
export function withDefinitions(definitions: ContentComponentDefinition[]): ContentTemplatesFeature {
  const record = Object.fromEntries(definitions.map((definition) => [definition.name, definition]));
  return {
    kind: ContentTemplatesFeatureKind.Definitions,
    providers: [{ provide: CONTENT_COMPONENT_DEFINITIONS, useValue: record, multi: true }],
  };
}

/**
 * Registers component definitions loaded on first use. Each loaded definition's `name` must equal its key.
 *
 * @param loaders Definition loaders keyed by definition name.
 * @returns Feature consumed by {@link provideContentTemplates}.
 */
export function withLazyDefinitions(
  loaders: Record<string, () => Promisable<ContentComponentDefinition>>,
): ContentTemplatesFeature {
  return {
    kind: ContentTemplatesFeatureKind.LazyDefinitions,
    providers: [{ provide: CONTENT_COMPONENT_DEFINITIONS, useValue: loaders, multi: true }],
  };
}

/**
 * Registers data loader factories. Each factory runs once, on first use, in the environment injection context.
 *
 * @param factories Loader factories keyed by loader name.
 * @param config Loader configuration. When omitted, a parent injector's configuration applies.
 * @returns Feature consumed by {@link provideContentTemplates}.
 * @throws In dev mode, when `config.defaultLoader` is not a key of `factories`.
 */
export function withDataLoaders(
  factories: Record<string, ContentDataLoaderFactory>,
  config?: ContentDataLoaderConfig,
): ContentTemplatesFeature {
  const providers: Provider[] = [{ provide: CONTENT_DATA_LOADERS, useValue: factories, multi: true }];
  if (config) {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      checkDefaultLoader(factories, config);
    }
    providers.push(CONTENT_DATA_LOADER_CONFIG.provide(config));
  }

  return { kind: ContentTemplatesFeatureKind.DataLoaders, providers };
}

/**
 * Registers data parser factories. Each factory runs once, on first use, in the environment injection context.
 *
 * @param factories Parser factories keyed by parser name.
 * @returns Feature consumed by {@link provideContentTemplates}.
 */
export function withDataParsers(factories: Record<string, ContentDataParserFactory>): ContentTemplatesFeature {
  return {
    kind: ContentTemplatesFeatureKind.DataParsers,
    providers: [{ provide: CONTENT_DATA_PARSERS, useValue: factories, multi: true }],
  };
}

/**
 * Creates environment providers for content templates, including a {@link ContentDefinitionRegistry},
 * {@link ContentDataLoaderRegistry}, and {@link ContentDataParserRegistry} for this injector.
 *
 * Names not registered here are resolved through the registries of a parent environment injector, so routes can add
 * registrations on top of the application's.
 *
 * @param features Definitions, loaders, and parsers to register.
 * @returns Environment providers to add to application or route providers.
 * @throws In dev mode, when more than one feature provides a data loader configuration.
 */
export function provideContentTemplates(...features: ContentTemplatesFeature[]): EnvironmentProviders {
  const providers = features.flatMap((feature) => feature.providers);
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    checkDataLoaderConfig(providers);
  }

  return makeEnvironmentProviders([
    // Empty contributions keep the multi tokens resolvable when a feature kind is not used.
    { provide: CONTENT_COMPONENT_DEFINITIONS, useValue: {}, multi: true },
    { provide: CONTENT_DATA_LOADERS, useValue: {}, multi: true },
    { provide: CONTENT_DATA_PARSERS, useValue: {}, multi: true },
    ...providers,
    ContentDefinitionRegistry,
    ContentDataLoaderRegistry,
    ContentDataParserRegistry,
  ]);
}

/**
 * Validates that the configured default loader is registered alongside it.
 *
 * @param factories Loader factories keyed by loader name.
 * @param config Loader configuration.
 * @throws When `config.defaultLoader` is not a key of `factories`.
 */
function checkDefaultLoader(
  factories: Record<string, ContentDataLoaderFactory>,
  config: ContentDataLoaderConfig,
): void {
  const { defaultLoader } = config;
  if (defaultLoader !== undefined && !Object.hasOwn(factories, defaultLoader)) {
    throw new Error(`Default data loader '${defaultLoader}' is not registered.`);
  }
}

/**
 * Validates that at most one data loader configuration is provided.
 *
 * @param providers Providers contributed by the features.
 * @throws When more than one data loader configuration is provided.
 */
function checkDataLoaderConfig(providers: Provider[]): void {
  const configs = providers.filter(
    (provider) =>
      typeof provider === 'object' && 'provide' in provider && provider.provide === CONTENT_DATA_LOADER_CONFIG.token,
  );
  if (configs.length > 1) {
    throw new Error('Only one data loader configuration can be provided.');
  }
}
