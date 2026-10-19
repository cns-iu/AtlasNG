import { Service } from '@angular/core';
import { JsonValue } from 'type-fest';
import { DataLoader, DataLoaderContext } from '../data-loader-registry';

/**
 * Configuration of {@link InlineDataLoader}, i.e. the source without its `parser`.
 */
export interface InlineDataLoaderConfig {
  /** Data embedded in the document. */
  value: JsonValue;
}

/**
 * Returns data embedded in the document, e.g. `{ "type": "inline", "value": { ... } }`.
 *
 * Provided in the root injector. Register with `withDataLoaders({ inline: () => inject(InlineDataLoader) })`.
 */
@Service()
export class InlineDataLoader implements DataLoader<InlineDataLoaderConfig, JsonValue> {
  /**
   * Returns `config.value` as is.
   *
   * @param config Loader configuration.
   * @param _context Node being resolved and abort signal. Unused.
   * @returns The embedded value.
   */
  load(config: InlineDataLoaderConfig, _context: DataLoaderContext): JsonValue {
    return config.value;
  }
}
