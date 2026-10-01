import { Observable } from 'rxjs';
import { Promisable } from 'type-fest';
import { ContentElementNode } from './content-document';

/** A value available now or later. Observables use their first emission. */
export type AsyncValue<T> = T | Promise<T> | Observable<T>; // TODO add angular Resource? Signal?

/** Context passed to data loaders and parsers. */
export interface ContentDataContext {
  /** Node whose data is being resolved. */
  node: Readonly<ContentElementNode>;
  /** Aborted when the document changes or the renderer is destroyed. */
  signal: AbortSignal;
}

/**
 * Fetches raw data for a {@link ContentDataSource}. Loaders only fetch; transformation belongs in a parser.
 * Instances are created by a factory given at registration, which runs in an injection context; `load` does not.
 */
export interface ContentDataLoader<TConfig extends { type: string } = { type: string }, TResult = unknown> {
  /**
   * Loads the data.
   * @param config The source's `loader` object as is, including `type`; `{ type }` for the string form.
   * @param context Node being resolved and abort signal.
   * @returns The loaded value.
   */
  load(config: TConfig, context: ContentDataContext): AsyncValue<TResult>;
}

/**
 * Transforms a loader's result, e.g. parsing CSV text into rows.
 * Instances are created by a factory given at registration, which runs in an injection context; `parse` does not.
 */
export interface ContentDataParser<
  TConfig extends { type: string } = { type: string },
  TInput = unknown,
  TOutput = unknown,
> {
  /**
   * Parses the loader's result.
   * @param input Value produced by the loader.
   * @param config The source's `parser` object as is, including `type`; `{ type }` for the string form.
   * @param context Node being resolved and abort signal.
   * @returns The parsed value.
   */
  parse(input: TInput, config: TConfig, context: ContentDataContext): Promisable<TOutput>;
}
