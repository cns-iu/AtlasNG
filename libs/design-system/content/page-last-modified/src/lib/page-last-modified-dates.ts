import { Location } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  computed,
  DestroyRef,
  type EnvironmentProviders,
  inject,
  Injectable,
  InjectionToken,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';

/** Options for {@link providePageLastModified}. */
export interface PageLastModifiedOptions {
  /**
   * URL of the JSON file that maps routes to last modified dates, for example `page-last-modified.json`.
   * Relative URLs resolve against the document base URL. The `@atlasng/nx-plugin:page-last-modified`
   * executor generates this file from Git history.
   */
  url: string;
}

/** Injection token for the {@link PageLastModifiedOptions}. */
const PAGE_LAST_MODIFIED_OPTIONS = new InjectionToken<PageLastModifiedOptions>('PageLastModifiedOptions');

/**
 * Looks up the last modified date of the current route in the JSON file registered with
 * {@link providePageLastModified}. The file is fetched once with `HttpClient`.
 */
@Injectable()
export class PageLastModifiedDates {
  /** Location used to read the current path and follow navigation. */
  readonly #location = inject(Location);

  /** Current route, normalized for lookups in the dates file. */
  readonly #route = signal(normalizeRoute(this.#location.path()));

  /** Location of the dates file. */
  readonly #options = inject(PAGE_LAST_MODIFIED_OPTIONS);

  /** Dates file, keyed by route. */
  readonly #dates = httpResource<Record<string, unknown>>(() => this.#options.url);

  /** Last modified date of the current route, or `undefined` when it is missing or the file failed to load. */
  readonly current = computed(() => {
    const dates = this.#dates.hasValue() ? this.#dates.value() : undefined;
    const date = dates?.[this.#route()];
    return typeof date === 'string' ? date : undefined;
  });

  /** Follows URL changes for the lifetime of the injector. */
  constructor() {
    const unsubscribe = this.#location.onUrlChange(() => this.#route.set(normalizeRoute(this.#location.path())));
    inject(DestroyRef).onDestroy(unsubscribe);
  }
}

/**
 * Lets `ang-page-last-modified` look up the current route's date in a JSON file that maps routes to dates,
 * for example `{ "/dataset/heart": "2026-06-16" }`. Requires `provideHttpClient()`.
 *
 * @param options Location of the dates file.
 * @returns Providers to include in the application providers.
 */
export function providePageLastModified(options: PageLastModifiedOptions): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: PAGE_LAST_MODIFIED_OPTIONS, useValue: options }, PageLastModifiedDates]);
}

/**
 * Normalizes a path to the route format of the dates file by dropping the query, fragment, and trailing slash.
 *
 * @param path Path from `Location.path()`, for example `/dataset/heart/?tab=1#files`.
 * @returns The route, for example `/dataset/heart`.
 */
function normalizeRoute(path: string): string {
  const route = path.split(/[?#]/, 1)[0].replace(/^\/+|\/+$/g, '');
  return `/${route}`;
}
