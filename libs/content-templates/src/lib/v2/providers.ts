import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import { provideDefinitions } from '@atlasng/content-templates/definitions';
import { DataLoader, provideDataLoaders } from '@atlasng/content-templates/loaders';
import { DataParser, provideDataParsers } from '@atlasng/content-templates/parsers';
import { ContentDefinition } from '@atlasng/content-templates/types';
import { Promisable } from 'type-fest';
import { CONTENT_TEMPLATES_CONFIG, ContentTemplatesConfig } from './config';

/** Provider bundle returned by content-templates feature helpers. */
export interface ContentTemplatesFeature {
  /** Feature discriminator. */
  kind: ContentTemplatesFeatureKind;
  /** Providers contributed by the feature. */
  providers: Provider[];
}

/** Content-templates feature variants supported by {@link provideContentTemplates}. */
export enum ContentTemplatesFeatureKind {
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
 * @returns Feature consumed by {@link provideContentTemplates}.
 */
export function withDefinitions(
  definitions: ContentDefinition[] | Record<string, () => Promisable<ContentDefinition>>,
): ContentTemplatesFeature {
  return {
    kind: ContentTemplatesFeatureKind.Definitions,
    providers: [provideDefinitions(definitions)],
  };
}

/**
 * Registers data loader factories through `provideDataLoaders`.
 *
 * @param loaders Loader factories keyed by loader name.
 * @returns Feature consumed by {@link provideContentTemplates}.
 */
export function withDataLoaders(loaders: Record<string, () => Promisable<DataLoader>>): ContentTemplatesFeature {
  return {
    kind: ContentTemplatesFeatureKind.DataLoaders,
    providers: [provideDataLoaders(loaders)],
  };
}

/**
 * Registers data parser factories through `provideDataParsers`.
 *
 * @param parsers Parser factories keyed by parser name.
 * @returns Feature consumed by {@link provideContentTemplates}.
 */
export function withDataParsers(parsers: Record<string, () => Promisable<DataParser>>): ContentTemplatesFeature {
  return {
    kind: ContentTemplatesFeatureKind.DataParsers,
    providers: [provideDataParsers(parsers)],
  };
}

/**
 * Creates environment providers for content templates.
 *
 * Definitions, loaders, and parsers not registered in this injector are resolved through the registries of a parent
 * environment injector, so routes can add registrations on top of the application's.
 *
 * @param config Content templates configuration. Defaults to an empty configuration.
 * @param features Definitions, loaders, and parsers to register.
 * @returns Environment providers to add to application or route providers.
 */
export function provideContentTemplates(
  config?: ContentTemplatesConfig,
  ...features: ContentTemplatesFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    CONTENT_TEMPLATES_CONFIG.provide(config ?? {}),
    ...features.flatMap((feature) => feature.providers),
  ]);
}
