import { ContentDataContext, ContentDataParser } from '../types/content-data';

/**
 * Configuration of {@link JsonContentDataParser}, i.e. the source's `parser` object.
 */
export interface JsonContentDataParserConfig {
  /** Name the parser is registered under. */
  type: string;
}

/**
 * Parses JSON text, e.g. a response loaded with `responseType: 'text'`. Non-string input is returned unchanged, so
 * the parser can be applied to already parsed data.
 *
 * Register with `withDataParsers({ json: () => new JsonContentDataParser() })`.
 */
export class JsonContentDataParser implements ContentDataParser<JsonContentDataParserConfig, unknown, unknown> {
  /**
   * Parses `input` with `JSON.parse` when it is a string.
   *
   * @param input Loader result.
   * @param _config Parser configuration. Unused.
   * @param _context Node being resolved and abort signal. Unused.
   * @returns The parsed value, or `input` when it is not a string.
   * @throws {SyntaxError} When `input` is a string that is not valid JSON.
   */
  parse(input: unknown, _config: JsonContentDataParserConfig, _context: ContentDataContext): unknown {
    return typeof input === 'string' ? JSON.parse(input) : input;
  }
}
