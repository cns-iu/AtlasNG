import { inject, InjectionToken, Injector, Service } from '@angular/core';
import { ContentElementNode } from '@atlasng/content-templates/types';
import { LazyChainedRegistry } from '@atlasng/content-templates/utils';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { Promisable } from 'type-fest';
import { JsonDataParser } from './json-parser/json-parser';
import { PassthroughDataParser } from './passthrough-parser/passthrough-parser';

/** Context passed to {@link DataParser.parse}. */
export interface DataParserContext {
  /** Node whose data is being resolved. */
  node: Readonly<ContentElementNode>;
  /** Path of the node in the document, e.g. `content.@default[0]`. Pass it to `ContentValidationError`. */
  path: string;
  /** Data key being resolved, e.g. `rows`. Config issues belong at `['data', key, ...]`. */
  key: string;
  /** Aborted when the document changes or the renderer is destroyed. */
  signal: AbortSignal;
}

/**
 * Transforms a loader's result, e.g. parsing CSV text into rows.
 * Instances are created by a factory given at registration, which runs in an injection context; `parse` does not.
 */
export interface DataParser<TConfig = unknown, TInput = unknown, TOutput = unknown> {
  /**
   * Validates the parser's config, i.e. the source's `parser` object without `type` (`{}` for the string form), once
   * before the first {@link parse}. Its output is what `parse` receives. Issues fail the node, with paths under
   * `['data', <key>, 'parser']`. Without a schema, the config is passed as is.
   */
  readonly configSchema?: StandardSchemaV1<unknown, TConfig>;

  /**
   * Parses the loader's result.
   * @param input Value produced by the loader.
   * @param config The source's `parser` object without `type`, as validated by {@link configSchema} when there is
   *   one.
   * @param context Node being resolved and abort signal.
   * @returns The parsed value.
   */
  parse(input: TInput, config: TConfig, context: DataParserContext): Promisable<TOutput>;
}

/**
 * Multi token collecting data parser factories keyed by parser name. Each factory runs once, on first use, in the
 * environment injection context.
 */
export const DATA_PARSERS = new InjectionToken<Record<string, () => Promisable<DataParser>>[]>('DATA_PARSERS');

/**
 * Parsers available in every application: `json` ({@link JsonDataParser}) and `passthrough` ({@link PassthroughDataParser}).
 * Registering a parser under the same name replaces the built-in.
 */
const BUILT_IN_DATA_PARSERS: Record<string, () => Promisable<DataParser>> = {
  json: () => inject(JsonDataParser),
  passthrough: () => inject(PassthroughDataParser),
};

/**
 * Resolves data parsers by name.
 *
 * Provided by `provideDataParsers`. Names not registered in this injector are looked up in the registry of a parent
 * environment injector, if any. A registry without a parent also holds the built-in parsers, so they are available
 * everywhere unless replaced.
 */
@Service()
export class DataParserRegistry extends LazyChainedRegistry<DataParser> {
  /** Collects the factories registered in this injector. */
  constructor() {
    const parent = inject(DataParserRegistry, { optional: true, skipSelf: true });
    const parsers = inject(DATA_PARSERS, { optional: true }) ?? [];
    // Only the root registry holds the built-ins; child registries reach them through the parent.
    const parsersWithBuiltins = parent ? parsers : [BUILT_IN_DATA_PARSERS, ...parsers];

    super(inject(Injector), parent, parsersWithBuiltins);
  }
}
