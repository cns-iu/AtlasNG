import { inject, InjectionToken, Injector, Service } from '@angular/core';
import { ContentElementNode } from '@atlasng/content-templates/types';
import { LazyChainedRegistry } from '@atlasng/content-templates/utils';
import { Promisable } from 'type-fest';
import { JsonDataParser } from './json-parser/json-parser';
import { PassthroughDataParser } from './passthrough-parser/passthrough-parser';

/** Context passed to {@link DataParser.parse}. */
export interface DataParserContext {
  /** Node whose data is being resolved. */
  node: Readonly<ContentElementNode>;
  /** Aborted when the document changes or the renderer is destroyed. */
  signal: AbortSignal;
}

/**
 * Transforms a loader's result, e.g. parsing CSV text into rows.
 * Instances are created by a factory given at registration, which runs in an injection context; `parse` does not.
 */
export interface DataParser<TConfig = unknown, TInput = unknown, TOutput = unknown> {
  /**
   * Parses the loader's result.
   * @param input Value produced by the loader.
   * @param config The source's `parser` object as is; `{ type }` for the string form. It still includes `type`, but
   *   parsers only need to declare the keys they use.
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
