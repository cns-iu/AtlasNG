import { inject, Injectable, InjectionToken } from '@angular/core';
import { createConfigurationToken, type } from '@atlasng/core';
import { Promisable } from 'type-fest';
import { ContentDataLoader } from '../types/content-data';
import { ContentRegistry } from './content-registry';

/** Creates a data loader. Runs once, on first use, in the environment injection context. */
export type ContentDataLoaderFactory = () => Promisable<ContentDataLoader>;

/** Configures how data loaders are selected. */
export interface ContentDataLoaderConfig {
  /** Name of the loader used for data given as a plain string. */
  defaultLoader?: string;
}

/** Multi token collecting data loader factories keyed by loader name. */
export const CONTENT_DATA_LOADERS = new InjectionToken<Record<string, ContentDataLoaderFactory>[]>(
  'CONTENT_DATA_LOADERS',
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

/**
 * Resolves data loaders by name.
 *
 * Provided by `provideContentTemplates`. Names not registered in this injector are looked up in the registry of a
 * parent environment injector, if any.
 */
@Injectable()
export class ContentDataLoaderRegistry extends ContentRegistry<ContentDataLoader> {
  /** Collects the factories registered in this injector. */
  constructor() {
    super(
      inject(ContentDataLoaderRegistry, { optional: true, skipSelf: true }),
      inject(CONTENT_DATA_LOADERS).flatMap((record) => Object.entries(record)),
    );
  }
}
