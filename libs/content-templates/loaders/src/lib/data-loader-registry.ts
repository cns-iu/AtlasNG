import { inject, InjectionToken, Injector, Service } from '@angular/core';
import { ContentElementNode } from '@atlasng/content-templates/types';
import { LazyChainedRegistry } from '@atlasng/content-templates/utils';
import { Observable } from 'rxjs';
import { Promisable } from 'type-fest';

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
 * Resolves data loaders by name.
 *
 * Provided by `provideContentTemplates`. Names not registered in this injector are looked up in the registry of a
 * parent environment injector, if any.
 */
@Service()
export class DataLoaderRegistry extends LazyChainedRegistry<DataLoader> {
  /** Collects the factories registered in this injector. */
  constructor() {
    super(
      inject(Injector),
      inject(DataLoaderRegistry, { optional: true, skipSelf: true }),
      inject(DATA_LOADERS, { optional: true }),
    );
  }
}
