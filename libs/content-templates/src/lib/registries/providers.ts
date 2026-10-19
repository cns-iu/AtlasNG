import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import { Promisable } from 'type-fest';
import { ContentDefinition } from '@atlasng/content-templates/types';
import { CONTENT_RENDERER_CONFIG, ContentRendererConfig } from '../renderer/config';
import { ContentResolver } from '../resolver/resolver';
import { DefinitionRegistry, provideDefinitions } from '@atlasng/content-templates/definitions';
import { DataLoader, DataLoaderRegistry, provideDataLoaders } from '@atlasng/content-templates/loaders';
import { DataParser, DataParserRegistry, provideDataParsers } from '@atlasng/content-templates/parsers';

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
 * Registers content definitions through {@link provideDefinitions}.
 *
 * @param definitions Definitions, or definition factories keyed by registered name.
 * @returns Feature consumed by {@link provideContentTemplates}.
 */
export function withDefinitions(
  definitions: ContentDefinition[] | Record<string, () => Promisable<ContentDefinition>>,
): ContentTemplatesFeature {
  return { kind: ContentTemplatesFeatureKind.Definitions, providers: [provideDefinitions(definitions)] };
}

/**
 * Registers data loader factories through {@link provideDataLoaders}.
 *
 * @param factories Loader factories keyed by loader name.
 * @returns Feature consumed by {@link provideContentTemplates}.
 */
export function withDataLoaders(factories: Record<string, () => Promisable<DataLoader>>): ContentTemplatesFeature {
  return { kind: ContentTemplatesFeatureKind.DataLoaders, providers: [provideDataLoaders(factories)] };
}

/**
 * Registers data parser factories through {@link provideDataParsers}.
 *
 * @param factories Parser factories keyed by parser name.
 * @returns Feature consumed by {@link provideContentTemplates}.
 */
export function withDataParsers(factories: Record<string, () => Promisable<DataParser>>): ContentTemplatesFeature {
  return { kind: ContentTemplatesFeatureKind.DataParsers, providers: [provideDataParsers(factories)] };
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
 * Creates environment providers for content templates, including a {@link DefinitionRegistry},
 * {@link DataLoaderRegistry}, {@link DataParserRegistry}, and {@link ContentResolver} for this injector.
 *
 * Names not registered here are resolved through the registries of a parent environment injector, so routes can add
 * registrations on top of the application's.
 *
 * @param features Definitions, loaders, and parsers to register.
 * @returns Environment providers to add to application or route providers.
 */
export function provideContentTemplates(...features: ContentTemplatesFeature[]): EnvironmentProviders {
  const providers = features.flatMap((feature) => feature.providers);

  return makeEnvironmentProviders([
    ...providers,
    DefinitionRegistry,
    DataLoaderRegistry,
    DataParserRegistry,
    ContentResolver,
  ]);
}
