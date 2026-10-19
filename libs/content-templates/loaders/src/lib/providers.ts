import { Provider } from '@angular/core';
import { Promisable } from 'type-fest';
import { DATA_LOADERS, DataLoader, DataLoaderRegistry } from './data-loader-registry';

/**
 * Registers data loader factories and provides a {@link DataLoaderRegistry} for the environment injector. Each
 * factory runs once, on first use, in the environment injection context. Names not registered in this injector are
 * resolved through the registry of a parent environment injector, so routes can add loaders on top of the
 * application's.
 *
 * @param loaders Loader factories keyed by loader name.
 * @returns Providers to add to application or route providers.
 */
export function provideDataLoaders(loaders: Record<string, () => Promisable<DataLoader>>): Provider {
  return [{ provide: DATA_LOADERS, useValue: loaders, multi: true }, DataLoaderRegistry];
}
