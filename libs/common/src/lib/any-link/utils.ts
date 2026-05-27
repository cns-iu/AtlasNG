import type { UrlTree } from '@angular/router';
import type { LinkCommand } from './link-handler';

/**
 * Returns whether an element is a native anchor-like tag (`<a>` or `<area>`).
 *
 * @param element Element to check.
 * @returns `true` when the element tag is `a` or `area`; otherwise `false`.
 */
export function isAnchorElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  return tagName === 'a' || tagName === 'area';
}

/**
 * Returns whether a custom element is anchor-like by checking for an observed `href` attribute.
 *
 * @param element Element to check.
 * @param registry Custom element registry used to resolve the element constructor.
 * @returns `true` if the custom element observes `href`; otherwise `false`.
 */
export function isAnchorLikeCustomElement(element: Element, registry: CustomElementRegistry | undefined): boolean {
  if (!registry) {
    return false;
  }

  const tagName = element.tagName.toLowerCase();
  const constructor = registry.get(tagName) as { observedAttributes?: string[] } | undefined;
  const attributes = constructor?.observedAttributes ?? [];
  return attributes.includes('href');
}

/**
 * Returns whether an element can be treated as a link target.
 *
 * Supports native anchors and custom elements that observe `href`.
 *
 * @param element Element to check.
 * @param registry Custom element registry used for custom-element checks.
 * @returns `true` when the element is native-anchor-like or custom-anchor-like.
 */
export function isAnchorLikeElement(
  element: Element | undefined,
  registry: CustomElementRegistry | undefined,
): boolean {
  return element !== undefined && (isAnchorElement(element) || isAnchorLikeCustomElement(element, registry));
}

/**
 * Type guard for Angular `UrlTree`-like objects.
 *
 * @param value Value to test.
 * @returns `true` when the value matches the `UrlTree` shape used by this library.
 */
export function isUrlTree(value: unknown): value is UrlTree {
  return (
    typeof value === 'object' && value !== null && 'root' in value && 'queryParams' in value && 'fragment' in value
  );
}

/**
 * Normalizes a value into an array.
 *
 * @param value Single item or array of items.
 * @returns The input array unchanged, or a new one-element array for scalar input.
 */
export function castArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * Returns whether a string can be parsed as an absolute URL.
 *
 * @param value URL string to validate.
 * @returns `true` when `URL` can parse the value; otherwise `false`.
 */
export function canParseUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes supported command attribute values into a `LinkCommand` object.
 *
 * @param value Input command value to normalize.
 * @returns A normalized `LinkCommand`, or `undefined` when input is nullish.
 */
export function commandAttribute(
  value: string | readonly unknown[] | UrlTree | LinkCommand | null | undefined,
): LinkCommand | undefined {
  if (value === null || value === undefined) {
    return undefined;
  } else if (typeof value === 'object' && 'command' in value) {
    return value;
  }

  return { command: value };
}

/**
 * Merges `source` into `target` while ignoring `undefined` values.
 *
 * @param target Base object to copy and merge into.
 * @param source Object containing override values.
 * @returns A merged object.
 */
export function safeMerge<T, U>(target: T, source: U): T & U {
  const result = { ...target } as T & U;

  for (const key in source) {
    const value = source[key];
    if (value !== undefined) {
      result[key] = value as (T & U)[typeof key];
    }
  }

  return result;
}
