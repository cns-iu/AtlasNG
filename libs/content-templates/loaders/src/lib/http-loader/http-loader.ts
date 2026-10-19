import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { DataLoader, DataLoaderContext } from '../data-loader-registry';

/** Response body types supported by {@link HttpDataLoader}. */
export type HttpDataResponseType = 'json' | 'text' | 'blob' | 'arraybuffer';

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
   * @param _context Node being resolved and abort signal. Unused; cancellation happens on unsubscribe.
   * @returns An observable emitting the response body.
   */
  load(config: HttpDataLoaderConfig, _context: DataLoaderContext): Observable<unknown> {
    const { url, responseType = 'json' } = config;
    return this.#http.get(url, { responseType: responseType as 'json' });
  }
}
