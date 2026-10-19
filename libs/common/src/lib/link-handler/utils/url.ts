import type { UrlCreationOptions, UrlTree } from '@angular/router';

/**
 * Type guard for Angular `UrlTree`-like objects.
 *
 * @param value Value to test.
 * @returns `true` when the value matches the `UrlTree` shape.
 */
export function isUrlTree(value: unknown): value is UrlTree {
  return (
    typeof value === 'object' && value !== null && 'root' in value && 'queryParams' in value && 'fragment' in value
  );
}

/**
 * Attempts to parse an absolute URL from a command-like value.
 *
 * Supports raw string input and single-item command arrays used by link handlers.
 * Relative paths and non-string values return `null`.
 *
 * @param value Potential absolute URL value.
 * @returns Parsed `URL` instance when successful; otherwise `null`.
 */
export function tryParseAbsoluteUrl(value: unknown): URL | null {
  if (Array.isArray(value) && value.length === 1) {
    value = value[0];
  }
  if (typeof value !== 'string') {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * URL schemes that are safe to navigate to programmatically.
 */
const SAFE_NAVIGATION_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:', 'mailto:', 'tel:', 'sms:', 'ftp:']);

/**
 * Checks whether a URL is safe to pass to `location.assign` or `location.replace`.
 *
 * Relative URLs are always safe. Absolute URLs are safe only when their scheme is in an allowlist,
 * which rejects script-executing schemes such as `javascript:` and `data:`.
 *
 * @param href URL to check.
 * @returns `true` when the URL can be navigated to safely, otherwise `false`.
 */
export function isSafeNavigationUrl(href: string): boolean {
  try {
    return SAFE_NAVIGATION_PROTOCOLS.has(new URL(href, 'http://localhost').protocol);
  } catch {
    return false;
  }
}

/**
 * Applies query params and fragment options from a link command onto an URL.
 *
 * Query params whose value is `null` or `undefined` are removed, matching Angular Router.
 *
 * @param url URL instance to mutate.
 * @param options Query param and fragment options to apply.
 */
export function applyQueryParamsAndFragmentToUrl(url: URL, options: UrlCreationOptions): void {
  if (!options.queryParamsHandling && options.queryParams) {
    url.search = '';
  }
  if (options.queryParamsHandling !== 'preserve' && options.queryParams) {
    for (const [key, value] of Object.entries(options.queryParams)) {
      url.searchParams.delete(key);
      if (value === null || value === undefined) {
        continue;
      }

      const values = Array.isArray(value) ? value : [value];
      for (const v of values) {
        url.searchParams.append(key, v);
      }
    }
  }

  if (!options.preserveFragment && options.fragment !== undefined) {
    url.hash = options.fragment;
  }
}
