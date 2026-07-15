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
 * Applies query params and fragment options from a link command onto an URL.
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
      const values = Array.isArray(value) ? value : [value];
      url.searchParams.delete(key);
      for (const v of values) {
        url.searchParams.append(key, v);
      }
    }
  }

  if (!options.preserveFragment && options.fragment !== undefined) {
    url.hash = options.fragment;
  }
}
