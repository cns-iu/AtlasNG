import { signal, Signal } from '@angular/core';
import { DataLoader, DataLoaderContext } from '@atlasng/content-templates/loaders';
import { DataParser, DataParserContext } from '@atlasng/content-templates/parsers';
import { ContentDataSchema, ContentDataSource } from '@atlasng/content-templates/types';
import { ContentValidationError, isContentDataSource } from '@atlasng/content-templates/utils';
import { StandardSchemaV1 } from '@standard-schema/spec';
import {
  concat,
  defer,
  fromEvent,
  isObservable,
  MonoTypeOperatorFunction,
  Observable,
  of,
  OperatorFunction,
  pipe,
  switchMap,
  takeUntil,
} from 'rxjs';
import { RenderElementNode } from '../nodes/render-node';
import { isStandardSchema, prefixIssues } from '../utils/standard-schema';
import { validateDataValue } from '../validation/data';
import { PipelineContext } from './context';

/** A parser reference in its object form. */
type ParserConfig = Exclude<NonNullable<ContentDataSource['parser']>, string>;

/** A loader or parser with its validated config. */
interface Configured<T> {
  /** The loader or parser. */
  instance: T;
  /** Its config, as output by its `configSchema` when it has one. */
  config: unknown;
}

/** Context passed to both the loader and the parser of a data value. */
type DataContext = DataLoaderContext & DataParserContext;

/** A data schema entry in its object form, with the initial value as a factory. */
interface NormalizedEntry {
  /** Schema validating the key's values. */
  schema: StandardSchemaV1<unknown>;
  /** Creates the initial value, if the entry declares one. */
  initialValue?: () => unknown;
}

/**
 * Loads, parses, and validates every data key the definition declares. Keys the node provides but the definition does
 * not declare are skipped; they were reported by the unknown-key checks.
 *
 * @param node Element node.
 * @param schemas The definition's data schemas, if any.
 * @param context Pipeline context.
 * @param onError Called with an error from a later emission, i.e. after the first value of its key was delivered.
 * @returns Signals keyed by data key, once each key has its first valid value. Rejects with the first failure.
 */
export async function loadData(
  node: RenderElementNode,
  schemas: ContentDataSchema | undefined,
  context: PipelineContext,
  onError: (error: unknown) => void,
): Promise<Record<string, Signal<unknown>>> {
  const entries = Object.entries(schemas ?? {}).map(([key, entry]) => loadEntry(node, key, entry, context, onError));
  return Object.fromEntries(await Promise.all(entries));
}

/**
 * Loads one data key: the node's source when it provides the key, or else the entry's initial value. Without either,
 * `undefined` is validated, so the schema decides whether the key is required.
 *
 * @param node Element node.
 * @param key Data key.
 * @param entry The definition's schema entry for the key.
 * @param context Pipeline context.
 * @param onError Called with an error after the first value was delivered.
 * @returns The key and a signal holding its latest valid value, once the first value is valid.
 */
async function loadEntry(
  node: RenderElementNode,
  key: string,
  entry: ContentDataSchema[string],
  context: PipelineContext,
  onError: (error: unknown) => void,
): Promise<[string, Signal<unknown>]> {
  const { schema, initialValue } = normalizeEntry(entry);
  const source = normalizeSource(node, key, context);

  if (!source && initialValue) {
    return [key, signal(initialValue()).asReadonly()];
  } else if (!source) {
    const result = await validateDataValue(schema, undefined, key, node.path);
    return [key, signal(result).asReadonly()];
  }

  const result = await loadSource(node, key, source, schema, initialValue, context, onError);
  return [key, result];
}

/**
 * Normalizes a data schema entry to its object form. A non-function initial value is wrapped in a factory.
 *
 * @param entry The definition's schema entry.
 * @returns The schema and, when declared, the initial value factory.
 */
function normalizeEntry(entry: ContentDataSchema[string]): NormalizedEntry {
  if (isStandardSchema(entry)) {
    return { schema: entry };
  }

  const { schema, initialValue } = entry;
  if (typeof initialValue === 'function') {
    return { schema, initialValue: initialValue as () => unknown };
  } else if (initialValue !== undefined) {
    return { schema, initialValue: () => initialValue };
  }

  return { schema };
}

/**
 * Normalizes a node's data value to a data source, applying the configured defaults: a plain string becomes a source
 * for `defaultLoader` with the string as `url`, and an array a source for `defaultInlineLoader` with the array as
 * `value`.
 *
 * @param node Element node.
 * @param key Data key.
 * @param context Pipeline context.
 * @returns The data source, or `undefined` when the node does not provide the key.
 * @throws {ContentValidationError} When the value is an object without a string `type`.
 */
function normalizeSource(
  node: RenderElementNode,
  key: string,
  { config }: PipelineContext,
): ContentDataSource | undefined {
  const value = node.source.data?.[key];
  if (value === undefined) {
    return undefined;
  } else if (typeof value === 'string') {
    return { type: config.defaultLoader, url: value };
  } else if (Array.isArray(value)) {
    return { type: config.defaultInlineLoader, value };
  } else if (isContentDataSource(value)) {
    return value;
  }

  throw new ContentValidationError(node.path, [
    { message: 'Expected a string, an array, or a data source with a string `type`.', path: ['data', key] },
  ]);
}

/**
 * Normalizes a parser reference to its object form. Sources without a parser get `defaultParser`.
 *
 * @param parser The source's parser reference.
 * @param context Pipeline context.
 * @returns The parser config.
 */
function normalizeParser(parser: string | ParserConfig | undefined, { config }: PipelineContext): ParserConfig {
  if (parser === undefined) {
    return { type: config.defaultParser };
  } else if (typeof parser === 'string') {
    return { type: parser };
  }

  return parser;
}

/**
 * Loads one data source into a signal. Emits the initial value first, if any, then every value of the loader, parsed
 * and validated (the initial value is not validated); a newer value supersedes one still being parsed or validated. Loading stops when the node aborts.
 *
 * @param node Element node.
 * @param key Data key, used in errors.
 * @param source Normalized data source.
 * @param schema Schema of the data key.
 * @param initialValue Creates the value used until the loader delivers one, if any.
 * @param context Pipeline context.
 * @param onError Called with an error after the first value was delivered.
 * @returns A signal holding the latest valid value, once the first value is valid. Rejects when the first value fails,
 *   when the loader completes without a value, or with the abort reason.
 * @throws {ContentValidationError} When the source's loader or parser is not registered. Invalid loader or parser
 *   config, as checked by their `configSchema`, rejects instead.
 */
function loadSource(
  node: RenderElementNode,
  key: string,
  source: ContentDataSource,
  schema: StandardSchemaV1<unknown>,
  initialValue: (() => unknown) | undefined,
  context: PipelineContext,
  onError: (error: unknown) => void,
): Promise<Signal<unknown>> {
  const { type: loaderType, parser: parserSource, ...loaderConfig } = source;
  const loaderPromise = context.loaders.get(loaderType);
  if (!loaderPromise) {
    throw new ContentValidationError(node.path, [
      { message: `Unknown data loader '${loaderType}'.`, path: ['data', key, 'type'] },
    ]);
  }

  const { type: parserType, ...parserConfig } = normalizeParser(parserSource, context);
  const parserPromise = context.parsers.get(parserType);
  if (!parserPromise) {
    throw new ContentValidationError(node.path, [
      { message: `Unknown data parser '${parserType}'.`, path: ['data', key, 'parser'] },
    ]);
  }

  const loader = configure(loaderPromise, loaderConfig, node.path, ['data', key]);
  const parser = configure(parserPromise, parserConfig, node.path, ['data', key, 'parser']);
  // The parser is only awaited once the loader emits, so a failure must not surface as an unhandled rejection.
  parser.catch(() => undefined);

  const { abortSignal } = node;
  const dataContext: DataContext = { node: node.source, path: node.path, key, signal: abortSignal };
  const values$ = of(null).pipe(
    withLoader(loader, dataContext),
    withParser(parser, dataContext),
    withValidation(schema, key, node.path),
    withInitialValue(initialValue),
    withAbortSignal(abortSignal),
  );

  return toDataSignal(values$, key, abortSignal, onError);
}

/**
 * Subscribes to a key's values and delivers them through a signal.
 *
 * @param values$ Validated values of the key.
 * @param key Data key, used in errors.
 * @param abortSignal The node's abort signal, whose reason is used when the values end because of it.
 * @param onError Called with an error after the first value was delivered.
 * @returns A signal holding the latest value, once the first value arrives. Rejects when the values error before
 *   that, or end without a value, with the abort reason when aborted.
 */
function toDataSignal(
  values$: Observable<unknown>,
  key: string,
  abortSignal: AbortSignal,
  onError: (error: unknown) => void,
): Promise<Signal<unknown>> {
  return new Promise((resolve, reject) => {
    const result = signal<unknown>(undefined);
    let hasValue = false;

    values$.subscribe({
      next: (value) => {
        result.set(value);
        if (!hasValue) {
          hasValue = true;
          resolve(result.asReadonly());
        }
      },
      error: (error) => (hasValue ? onError(error) : reject(error)),
      complete: () => {
        if (!hasValue) {
          let reason = abortSignal.reason;
          if (!abortSignal.aborted) {
            reason = new Error(`Data '${key}' completed without a value.`);
          }

          reject(reason);
        }
      },
    });
  });
}

/**
 * Awaits a registered loader or parser and validates its config with its `configSchema`, if it has one.
 *
 * @param entry The registered loader or parser.
 * @param config Its config: the source without `type` and `parser`, or the parser config without `type`.
 * @param path Path of the node, used in errors.
 * @param prefix Issue path prefix, e.g. `['data', 'rows']` or `['data', 'rows', 'parser']`.
 * @returns The loader or parser and its validated config. Rejects with a {@link ContentValidationError} when the config
 *   is invalid.
 */
async function configure<T extends DataLoader | DataParser>(
  entry: Promise<T>,
  config: object,
  path: string,
  prefix: PropertyKey[],
): Promise<Configured<T>> {
  const instance = await entry;
  const schema = instance.configSchema;
  if (!schema) {
    return { instance, config };
  }

  const result = await schema['~standard'].validate(config);
  if (result.issues) {
    throw new ContentValidationError(path, prefixIssues(result.issues, prefix));
  }

  return { instance, config: result.value };
}

/**
 * Replaces each value with the values of the loader. A loader returning a plain value or a promise emits once.
 *
 * @param loader The loader and its validated config.
 * @param context Context passed to the loader.
 * @returns The operator.
 */
function withLoader(loader: Promise<Configured<DataLoader>>, context: DataContext): OperatorFunction<unknown, unknown> {
  return pipe(
    switchMap(() => loader),
    switchMap(({ instance, config }) => {
      const result = instance.load(config, context);
      return isObservable(result) ? result : Promise.resolve(result);
    }),
  );
}

/**
 * Parses each value with the parser. A newer value supersedes one still being parsed.
 *
 * @param parser The parser and its validated config.
 * @param context Context passed to the parser.
 * @returns The operator.
 */
function withParser(parser: Promise<Configured<DataParser>>, context: DataContext): OperatorFunction<unknown, unknown> {
  return pipe(
    switchMap(async (value) => {
      const { instance, config } = await parser;
      return instance.parse(value, config, context);
    }),
  );
}

/**
 * Emits the initial value before the source's values. The initial value is neither parsed nor validated, since it is
 * given as the value the component receives, i.e. in the schema's output form.
 *
 * @param initialValue Creates the initial value, if any. Called on subscription.
 * @returns The operator, or an identity operator without an initial value.
 */
function withInitialValue(initialValue: (() => unknown) | undefined): OperatorFunction<unknown, unknown> {
  if (initialValue === undefined) {
    return pipe();
  }

  return (source$) =>
    concat(
      defer(() => of(initialValue())),
      source$,
    );
}

/**
 * Validates each value with the key's schema. A newer value supersedes one still being validated.
 *
 * @param schema Schema of the data key.
 * @param key Data key, used in issue paths.
 * @param path Path of the node, used in errors.
 * @returns The operator. Errors with a {@link ContentValidationError} on an invalid value.
 */
function withValidation(
  schema: StandardSchemaV1<unknown>,
  key: string,
  path: string,
): OperatorFunction<unknown, unknown> {
  return pipe(switchMap((value) => validateDataValue(schema, value, key, path)));
}

/**
 * Completes the stream when the signal aborts, or right away when it already has, so nothing is subscribed for an
 * aborted node.
 *
 * @param abortSignal Signal to follow.
 * @returns The operator.
 */
function withAbortSignal<T>(abortSignal: AbortSignal): MonoTypeOperatorFunction<T> {
  return takeUntil(abortSignal.aborted ? of(abortSignal.reason) : fromEvent(abortSignal, 'abort'));
}
