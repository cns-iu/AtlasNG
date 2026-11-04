import { HttpClient, HttpRequest } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { createSchema } from '@atlasng/content-blocks/utils';
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
 * Configuration of {@link HttpDataLoader}, i.e. the source without `type` and `parser`.
 */
export interface HttpDataLoaderConfig {
  /** URL to fetch. */
  url: string;
  /** How the response body is read. Defaults to `'json'`. */
  responseType?: HttpDataResponseType;
}

/**
 * Validates {@link HttpDataLoaderConfig}: a string `url` and a supported `responseType`, if any. Documents are untrusted
 * JSON, so the config may not match its type. The output has `responseType` defaulted.
 */
const HTTP_CONFIG_SCHEMA = createSchema<Required<HttpDataLoaderConfig>>((value) => {
  const { url, responseType = DEFAULT_RESPONSE_TYPE } = (value ?? {}) as Partial<Record<string, unknown>>;
  const issues: StandardSchemaV1.Issue[] = [];

  if (typeof url !== 'string') {
    issues.push({ message: 'Expected a string `url`.', path: ['url'] });
  }

  if (!RESPONSE_TYPES.includes(responseType as string)) {
    const validTypes = RESPONSE_TYPES.map((type) => `'${type}'`).join(', ');
    issues.push({ message: `Expected \`responseType\` to be one of ${validTypes}.`, path: ['responseType'] });
  }

  if (issues.length > 0) {
    return { issues };
  }

  return { value: { url: url as string, responseType: responseType as HttpDataResponseType } };
});

/**
 * Fetches data with a GET request through Angular's `HttpClient`.
 *
 * Provided in the root injector, so it uses the root `HttpClient`; register it with
 * `withDataLoaders({ http: () => inject(HttpDataLoader) })` together with `provideHttpClient()`. The request is
 * cancelled when the caller unsubscribes.
 */
@Service()
export class HttpDataLoader implements DataLoader<Required<HttpDataLoaderConfig>, unknown> {
  /** Requires a string `url`, checks `responseType`, and defaults it to `'json'`. */
  readonly configSchema = HTTP_CONFIG_SCHEMA;
  /** Client used for requests. */
  readonly #http = inject(HttpClient);

  /**
   * Requests `config.url`.
   *
   * @param config Loader configuration, validated by {@link configSchema}.
   * @param _context Node being resolved and abort signal. Unused; cancellation happens on unsubscribe.
   * @returns An observable emitting the response body.
   */
  load(config: Required<HttpDataLoaderConfig>, _context: DataLoaderContext): Observable<unknown> {
    const { url, responseType } = config;
    return this.#http.get(url, { responseType: responseType as 'json' });
  }
}
