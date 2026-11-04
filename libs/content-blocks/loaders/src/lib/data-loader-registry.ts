import { inject, InjectionToken, Injector, Service } from '@angular/core';
import { ContentBlockNode } from '@atlasng/content-blocks/types';
import { LazyChainedRegistry } from '@atlasng/content-blocks/utils';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { Observable } from 'rxjs';
import { Promisable } from 'type-fest';
import { HttpDataLoader } from './http-loader/http-loader';
import { InlineDataLoader } from './inline-loader/inline-loader';

/** Context passed to {@link DataLoader.load}. */
export interface DataLoaderContext {
  /** Node whose data is being resolved. */
  node: Readonly<ContentBlockNode>;
  /** Path of the node in the document, e.g. `content.@default[0]`. Pass it to `ContentValidationError`. */
  path: string;
  /** Data key being resolved, e.g. `rows`. Config issues belong at `['data', key, ...]`. */
  key: string;
  /** Aborted when the document changes or the renderer is destroyed. */
  signal: AbortSignal;
}

/**
 * Fetches raw data for a `ContentDataSource`. Loaders only fetch; transformation belongs in a parser.
 * Instances are created by a factory given at registration, which runs in an injection context; `load` does not.
 */
export interface DataLoader<TConfig = unknown, TResult = unknown> {
  /**
   * Validates the loader's config, i.e. the source without `type` and `parser`, before {@link load} is called. Its
   * output is what `load` receives, so it can apply defaults. Issues fail the node, with paths under
   * `['data', <key>]`. Without a schema, the config is passed as is.
   */
  readonly configSchema?: StandardSchemaV1<unknown, TConfig>;

  /**
   * Loads the data.
   * @param config The source without `type` and `parser`, as validated by {@link configSchema} when there is one.
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
