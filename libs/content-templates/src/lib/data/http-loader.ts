import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ContentDataContext, ContentDataLoader } from '../types/content-data';

/** Response body types supported by {@link HttpContentDataLoader}. */
export type HttpContentDataResponseType = 'json' | 'text' | 'blob' | 'arraybuffer';

/**
 * Configuration of {@link HttpContentDataLoader}, i.e. the source's `loader` object.
 */
export interface HttpContentDataLoaderConfig {
  /** Name the loader is registered under. */
  type: string;
  /** URL to fetch. Data given as a plain string becomes this value when this is the default loader. */
  url: string;
  /** How the response body is read. Defaults to `'json'`. */
  responseType?: HttpContentDataResponseType;
}

/**
 * Fetches data with a GET request through Angular's `HttpClient`.
 *
 * Must be created in an injection context where `HttpClient` is available, e.g.
 * `withDataLoaders({ http: () => new HttpContentDataLoader() })` together with `provideHttpClient()`.
 * The request is cancelled when the caller unsubscribes.
 */
export class HttpContentDataLoader implements ContentDataLoader<HttpContentDataLoaderConfig, unknown> {
  /** Client used for requests. */
  readonly #http = inject(HttpClient);

  /**
   * Requests `config.url`.
   *
   * @param config Loader configuration.
   * @param _context Node being resolved and abort signal. Unused; cancellation happens on unsubscribe.
   * @returns An observable emitting the response body.
   */
  load(config: HttpContentDataLoaderConfig, _context: ContentDataContext): Observable<unknown> {
    const { url, responseType = 'json' } = config;
    switch (responseType) {
      case 'text':
        return this.#http.get(url, { responseType: 'text' });
      case 'blob':
        return this.#http.get(url, { responseType: 'blob' });
      case 'arraybuffer':
        return this.#http.get(url, { responseType: 'arraybuffer' });
      default:
        return this.#http.get<unknown>(url, { responseType: 'json' });
    }
  }
}
