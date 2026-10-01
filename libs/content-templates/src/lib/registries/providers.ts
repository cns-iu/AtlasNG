import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import { ContentComponentDefinition } from '../types/content-component-definition';
import { CONTENT_RENDERER_CONFIG, ContentRendererConfig } from '../renderer/config';
import { ContentResolver } from '../resolver/resolver';
import {
  CONTENT_DATA_LOADER_CONFIG,
  CONTENT_DATA_LOADERS,
  ContentDataLoaderConfig,
  ContentDataLoaderFactory,
  ContentDataLoaderRegistry,
} from './data-loader-registry';
import { CONTENT_DATA_PARSERS, ContentDataParserFactory, ContentDataParserRegistry } from './data-parser-registry';
import {
  CONTENT_COMPONENT_DEFINITIONS,
  ContentComponentDefinitionFactory,
  ContentDefinitionRegistry,
} from './definition-registry';

/** Provider bundle returned by content-templates feature helpers. */
export interface ContentTemplatesFeature {
  /** Feature discriminator. */
  kind: ContentTemplatesFeatureKind;
  /** Providers contributed by the feature. */
  providers: Provider[];
}

/** Content-templates feature variants supported by {@link provideContentTemplates}. */
export enum ContentTemplatesFeatureKind {
  /** Feature registering component definitions. */
  Definitions,
  /** Feature registering data loaders. */
  DataLoaders,
  /** Feature registering data parsers. */
  DataParsers,
  /** Feature configuring the renderer. */
  RendererConfig,
}

/**
 * Registers component definitions.
 *
 * An array registers each definition under its `name`. A record registers factories under their keys; a factory runs
 * once, on first use, in the environment injection context, and may load the definition lazily. A key acts as an alias
 * and may differ from the definition's `name`.
 *
 * @param definitions Definitions, or definition factories keyed by registered name.
 * @returns Feature consumed by {@link provideContentTemplates}.
 */
export function withDefinitions(
  definitions: ContentComponentDefinition[] | Record<string, ContentComponentDefinitionFactory>,
): ContentTemplatesFeature {
  const record = Array.isArray(definitions)
    ? Object.fromEntries(definitions.map((definition) => [definition.name, () => definition]))
    : definitions;
  return {
    kind: ContentTemplatesFeatureKind.Definitions,
    providers: [{ provide: CONTENT_COMPONENT_DEFINITIONS, useValue: record, multi: true }],
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
 * Configures the content renderer, e.g. its default error component.
 *
 * @param config Renderer configuration. When omitted from an injector, a parent injector's configuration applies.
 * @returns Feature consumed by {@link provideContentTemplates}.
 */
export function withRendererConfig(config: ContentRendererConfig): ContentTemplatesFeature {
  return {
    kind: ContentTemplatesFeatureKind.RendererConfig,
    providers: [CONTENT_RENDERER_CONFIG.provide(config)],
  };
}

/**
 * Creates environment providers for content templates, including a {@link ContentDefinitionRegistry},
 * {@link ContentDataLoaderRegistry}, {@link ContentDataParserRegistry}, and {@link ContentResolver} for this injector.
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
    ContentResolver,
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
