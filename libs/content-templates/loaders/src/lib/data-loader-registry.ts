import { inject, InjectionToken, Injector, Service } from '@angular/core';
import { ContentElementNode } from '@atlasng/content-templates/types';
import { LazyChainedRegistry } from '@atlasng/content-templates/utils';
import { Observable } from 'rxjs';
import { Promisable } from 'type-fest';
import { HttpDataLoader } from './http-loader/http-loader';
import { InlineDataLoader } from './inline-loader/inline-loader';

/** Context passed to {@link DataLoader.load}. */
export interface DataLoaderContext {
  /** Node whose data is being resolved. */
  node: Readonly<ContentElementNode>;
  /** Aborted when the document changes or the renderer is destroyed. */
  signal: AbortSignal;
}

/**
 * Fetches raw data for a `ContentDataSource`. Loaders only fetch; transformation belongs in a parser.
 * Instances are created by a factory given at registration, which runs in an injection context; `load` does not.
 */
export interface DataLoader<TConfig = unknown, TResult = unknown> {
  /**
   * Loads the data.
   * @param config The source without its `parser` key. It still includes `type`, but loaders only need to declare the
   *   keys they use.
   * @param context Node being resolved and abort signal.
   * @returns The loaded value.
   */
  load(config: TConfig, context: DataLoaderContext): Promisable<TResult> | Observable<TResult>;
}

/**
 * Multi token collecting data loader factories keyed by loader name. Each factory runs once, on first use, in the
 * environment injection context.
 */
export const DATA_LOADERS = new InjectionToken<Record<string, () => Promisable<DataLoader>>[]>('DATA_LOADERS');

/**
 * Loaders available in every application: `http` ({@link HttpDataLoader}) and `inline` ({@link InlineDataLoader}).
 * Registering a loader under the same name replaces the built-in.
 */
const BUILT_IN_DATA_LOADERS: Record<string, () => Promisable<DataLoader>> = {
  http: () => inject(HttpDataLoader),
  inline: () => inject(InlineDataLoader),
};

/**
 * Resolves data loaders by name.
 *
 * Provided by `provideDataLoaders`. Names not registered in this injector are looked up in the registry of a parent
 * environment injector, if any. A registry without a parent also holds the built-in loaders, so they are available
 * everywhere unless replaced.
 */
@Service()
export class DataLoaderRegistry extends LazyChainedRegistry<DataLoader> {
  /** Collects the factories registered in this injector. */
  constructor() {
    const parent = inject(DataLoaderRegistry, { optional: true, skipSelf: true });
    const loaders = inject(DATA_LOADERS, { optional: true }) ?? [];
    // Only the root registry holds the built-ins; child registries reach them through the parent.
    const loadersWithBuiltins = parent ? loaders : [BUILT_IN_DATA_LOADERS, ...loaders];

    super(inject(Injector), parent, loadersWithBuiltins);
  }
}
