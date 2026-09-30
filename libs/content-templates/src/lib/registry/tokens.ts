import { InjectionToken } from '@angular/core';
import { createConfigurationToken, type } from '@atlasng/core';
import { Promisable } from 'type-fest';
import { ContentComponentDefinition } from '../types/content-component-definition';
import { ContentDataLoader, ContentDataParser } from '../types/content-data';

/** A component definition, or a lazy loader resolving to one. */
export type ContentComponentDefinitionEntry =
  ContentComponentDefinition | (() => Promisable<ContentComponentDefinition>);

/** Creates a data loader. Runs once, on first use, in the environment injection context. */
export type ContentDataLoaderFactory = () => ContentDataLoader;

/** Creates a data parser. Runs once, on first use, in the environment injection context. */
export type ContentDataParserFactory = () => ContentDataParser;

/** Configures how data loaders are selected. */
export interface ContentDataLoaderConfig {
  /** Name of the loader used for data given as a plain string. */
  defaultLoader?: string;
}

/** Multi token collecting component definition entries keyed by definition name. */
export const CONTENT_COMPONENT_DEFINITIONS = new InjectionToken<Record<string, ContentComponentDefinitionEntry>[]>(
  'CONTENT_COMPONENT_DEFINITIONS',
);

/** Multi token collecting data loader factories keyed by loader name. */
export const CONTENT_DATA_LOADERS = new InjectionToken<Record<string, ContentDataLoaderFactory>[]>(
  'CONTENT_DATA_LOADERS',
);

/** Multi token collecting data parser factories keyed by parser name. */
export const CONTENT_DATA_PARSERS = new InjectionToken<Record<string, ContentDataParserFactory>[]>(
  'CONTENT_DATA_PARSERS',
);

/**
 * Data loader configuration. Provided by `withDataLoaders`; a child injector without its own config inherits the
 * parent's.
 */
export const CONTENT_DATA_LOADER_CONFIG = createConfigurationToken({
  name: 'CONTENT_DATA_LOADER_CONFIG',
  config: type<ContentDataLoaderConfig>(),
  defaults: () => ({}),
});
