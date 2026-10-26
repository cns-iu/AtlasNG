import { Service } from '@angular/core';
import { DataParser, DataParserContext } from '../data-parser-registry';

/**
 * Returns the loader's result unchanged, e.g. as a placeholder parser or to register a name that skips parsing.
 *
 * Provided in the root injector. Register with `withDataParsers({ passthrough: () => inject(PassthroughDataParser) })`.
 */
@Service()
export class PassthroughDataParser implements DataParser<unknown, unknown, unknown> {
  /**
   * Returns `input` as is.
   *
   * @param input Loader result.
   * @param _config Parser configuration. Unused.
   * @param _context Node being resolved and abort signal. Unused.
   * @returns `input`.
   */
  parse<T>(input: T, _config: unknown, _context: DataParserContext): T {
    return input;
  }
}
