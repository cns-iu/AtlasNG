import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import { provideDefinitions } from '@atlasng/content-blocks/definitions';
import { DataLoader, provideDataLoaders } from '@atlasng/content-blocks/loaders';
import { DataParser, provideDataParsers } from '@atlasng/content-blocks/parsers';
import { ContentDefinition } from '@atlasng/content-blocks/types';
import { Promisable } from 'type-fest';
import { CONTENT_BLOCKS_CONFIG, ContentBlocksConfig } from './config';

/** Provider bundle returned by content-blocks feature helpers. */
export interface ContentBlocksFeature {
  /** Feature discriminator. */
  kind: ContentBlocksFeatureKind;
  /** Providers contributed by the feature. */
  providers: Provider[];
}

/** Content-blocks feature variants supported by {@link provideContentBlocks}. */
export enum ContentBlocksFeatureKind {
  /** Feature registering content definitions. */
  Definitions,
  /** Feature registering data loaders. */
  DataLoaders,
  /** Feature registering data parsers. */
  DataParsers,
}

/**
 * Registers content definitions through `provideDefinitions`.
 *
 * @param definitions Definitions, or definition factories keyed by registered name.
 * @returns Feature consumed by {@link provideContentBlocks}.
 */
export function withDefinitions(
  definitions: ContentDefinition[] | Record<string, () => Promisable<ContentDefinition>>,
): ContentBlocksFeature {
  return {
    kind: ContentBlocksFeatureKind.Definitions,
    providers: [provideDefinitions(definitions)],
  };
}

/**
 * Registers data loader factories through `provideDataLoaders`.
 *
 * @param loaders Loader factories keyed by loader name.
 * @returns Feature consumed by {@link provideContentBlocks}.
 */
export function withDataLoaders(loaders: Record<string, () => Promisable<DataLoader>>): ContentBlocksFeature {
  return {
    kind: ContentBlocksFeatureKind.DataLoaders,
    providers: [provideDataLoaders(loaders)],
  };
}

/**
 * Registers data parser factories through `provideDataParsers`.
 *
 * @param parsers Parser factories keyed by parser name.
 * @returns Feature consumed by {@link provideContentBlocks}.
 */
export function withDataParsers(parsers: Record<string, () => Promisable<DataParser>>): ContentBlocksFeature {
  return {
    kind: ContentBlocksFeatureKind.DataParsers,
    providers: [provideDataParsers(parsers)],
  };
}

/**
 * Creates environment providers for content blocks.
 *
 * Definitions, loaders, and parsers not registered in this injector are resolved through the registries of a parent
 * environment injector, so routes can add registrations on top of the application's.
 *
 * @param config Content blocks configuration. Defaults to an empty configuration.
 * @param features Definitions, loaders, and parsers to register.
 * @returns Environment providers to add to application or route providers.
 */
export function provideContentBlocks(
  config?: ContentBlocksConfig,
  ...features: ContentBlocksFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    CONTENT_BLOCKS_CONFIG.provide(config ?? {}),
    ...features.flatMap((feature) => feature.providers),
  ]);
}
