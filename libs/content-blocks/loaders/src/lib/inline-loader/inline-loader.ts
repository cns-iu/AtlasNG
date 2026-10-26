import { Service } from '@angular/core';
import { createSchema } from '@atlasng/content-blocks/utils';
import { JsonValue } from 'type-fest';
import { DataLoader, DataLoaderContext } from '../data-loader-registry';

/**
 * Configuration of {@link InlineDataLoader}, i.e. the source without `type` and `parser`.
 */
export interface InlineDataLoaderConfig {
  /** Data embedded in the document. */
  value: JsonValue;
}

/** Validates {@link InlineDataLoaderConfig}: the source must have a `value`, which may be `null`. */
const INLINE_CONFIG_SCHEMA = createSchema<InlineDataLoaderConfig>((value) => {
  const config = (value ?? {}) as Partial<InlineDataLoaderConfig>;
  if (config.value === undefined) {
    return { issues: [{ message: 'Expected a `value`.', path: ['value'] }] };
  }

  return { value: { value: config.value } };
});

/**
 * Returns data embedded in the document, e.g. `{ "type": "inline", "value": { ... } }`.
 *
 * Provided in the root injector. Register with `withDataLoaders({ inline: () => inject(InlineDataLoader) })`.
 */
@Service()
export class InlineDataLoader implements DataLoader<InlineDataLoaderConfig, JsonValue> {
  /** Requires a `value`. */
  readonly configSchema = INLINE_CONFIG_SCHEMA;

  /**
   * Returns `config.value` as is.
   *
   * @param config Loader configuration, validated by {@link configSchema}.
   * @param _context Node being resolved and abort signal. Unused.
   * @returns The embedded value.
   */
  load(config: InlineDataLoaderConfig, _context: DataLoaderContext): JsonValue {
    return config.value;
  }
}
