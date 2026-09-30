import { JsonValue } from 'type-fest';
import { ContentDataContext, ContentDataLoader } from '../types/content-data';

/**
 * Configuration of {@link InlineContentDataLoader}, i.e. the source's `loader` object.
 */
export interface InlineContentDataLoaderConfig {
  /** Name the loader is registered under. */
  type: string;
  /** Data embedded in the document. */
  value: JsonValue;
}

/**
 * Returns data embedded in the document, e.g. `{ "loader": { "type": "inline", "value": { ... } } }`.
 *
 * Register with `withDataLoaders({ inline: () => new InlineContentDataLoader() })`.
 */
export class InlineContentDataLoader implements ContentDataLoader<InlineContentDataLoaderConfig, JsonValue> {
  /**
   * Returns `config.value` as is.
   *
   * @param config Loader configuration.
   * @param _context Node being resolved and abort signal. Unused.
   * @returns The embedded value.
   */
  load(config: InlineContentDataLoaderConfig, _context: ContentDataContext): JsonValue {
    return config.value;
  }
}
