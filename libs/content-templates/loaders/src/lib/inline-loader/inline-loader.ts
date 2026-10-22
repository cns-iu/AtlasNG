import { Service } from '@angular/core';
import { ContentValidationError } from '@atlasng/content-templates/utils';
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
   * @param context Node being resolved and abort signal.
   * @returns The embedded value.
   * @throws {ContentValidationError} When the source has no `value`.
   */
  load(config: InlineDataLoaderConfig, context: DataLoaderContext): JsonValue {
    if (config.value === undefined) {
      throw new ContentValidationError(context.path, [
        { message: 'Expected a `value`.', path: ['data', context.key, 'value'] },
      ]);
    }

    return config.value;
  }
}
