import { HttpClient, HttpRequest } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { ContentValidationError } from '@atlasng/content-templates/utils';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { Observable } from 'rxjs';
import { DataLoader, DataLoaderContext } from '../data-loader-registry';

/** Response body types supported by {@link HttpDataLoader}, i.e. those of Angular's `HttpClient`. */
export type HttpDataResponseType = HttpRequest<unknown>['responseType'];

/**
 * Every {@link HttpDataResponseType}, used to validate the config. Listed as record keys, so `satisfies` reports both a
 * missing and an extra response type.
 */
const RESPONSE_TYPES = Object.keys({
  json: true,
  text: true,
  blob: true,
  arraybuffer: true,
} satisfies Record<HttpDataResponseType, true>);

/** Response type used when the config declares none. */
const DEFAULT_RESPONSE_TYPE: HttpDataResponseType = 'json';

/**
 * Configuration of {@link HttpDataLoader}, i.e. the source without its `parser`.
 */
export interface HttpDataLoaderConfig {
  /** URL to fetch. */
  url: string;
  /** How the response body is read. Defaults to `'json'`. */
  responseType?: HttpDataResponseType;
}

/**
 * Fetches data with a GET request through Angular's `HttpClient`.
 *
 * Provided in the root injector, so it uses the root `HttpClient`; register it with
 * `withDataLoaders({ http: () => inject(HttpDataLoader) })` together with `provideHttpClient()`. The request is
 * cancelled when the caller unsubscribes.
 */
@Service()
export class HttpDataLoader implements DataLoader<HttpDataLoaderConfig, unknown> {
  /** Client used for requests. */
  readonly #http = inject(HttpClient);

  /**
   * Requests `config.url`.
   *
   * @param config Loader configuration.
   * @param context Node being resolved and abort signal. Cancellation happens on unsubscribe.
   * @returns An observable emitting the response body.
   * @throws {ContentValidationError} When `url` is not a string or `responseType` is not supported.
   */
  load(config: HttpDataLoaderConfig, context: DataLoaderContext): Observable<unknown> {
    this.#validateConfig(config, context);

    const { url, responseType = DEFAULT_RESPONSE_TYPE } = config;
    return this.#http.get(url, { responseType: responseType as 'json' });
  }

  /**
   * Checks that the config has a string `url` and a supported `responseType`, if any. Documents are untrusted JSON, so
   * the config may not match {@link HttpDataLoaderConfig}.
   *
   * @param config Loader configuration.
   * @param context Node being resolved; its `path` and `key` locate the issues.
   * @throws {ContentValidationError} With one issue per invalid key, at `['data', key, <config key>]`.
   */
  #validateConfig(config: HttpDataLoaderConfig, context: DataLoaderContext): void {
    const { url, responseType = DEFAULT_RESPONSE_TYPE } = config;
    const issues: StandardSchemaV1.Issue[] = [];

    if (typeof url !== 'string') {
      issues.push({ message: 'Expected a string `url`.', path: ['data', context.key, 'url'] });
    }

    if (!RESPONSE_TYPES.includes(responseType)) {
      const validTypes = RESPONSE_TYPES.map((type) => `'${type}'`).join(', ');
      issues.push({
        message: `Expected \`responseType\` to be one of ${validTypes}.`,
        path: ['data', context.key, 'responseType'],
      });
    }

    if (issues.length > 0) {
      throw new ContentValidationError(context.path, issues);
    }
  }
}
