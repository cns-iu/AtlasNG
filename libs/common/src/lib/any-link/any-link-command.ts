import type { UrlTree } from '@angular/router';
import type { LinkCommand } from '../links/handler';
import { isUrlTree } from '../links/shared/url';

/**
 * Input accepted by {@link AnyLink} for configuring navigation.
 *
 * Shorthand route values are normalized to a {@link LinkCommand}, while `null`
 * and `undefined` represent a link without a navigation command.
 */
export type AnyLinkCommand = string | readonly unknown[] | UrlTree | LinkCommand | null | undefined;

/**
 * Checks whether a value can be used as an {@link AnyLinkCommand}.
 *
 * @param value Value to inspect.
 * @returns `true` when the value is a supported shorthand, a `UrlTree`, a
 * {@link LinkCommand}, or an empty command value.
 */
export function isAnyLinkCommand(value: unknown): value is AnyLinkCommand {
  return (
    value === undefined ||
    value === null ||
    typeof value === 'string' ||
    Array.isArray(value) ||
    isUrlTree(value) ||
    (typeof value === 'object' && 'command' in value)
  );
}

/**
 * Normalizes an {@link AnyLinkCommand} into the object form consumed by link handlers.
 *
 * Existing {@link LinkCommand} objects are returned unchanged so their URL creation
 * options are preserved.
 *
 * @param value Command input to normalize.
 * @returns A link command, or `undefined` when no command was supplied.
 */
export function commandAttribute(value: AnyLinkCommand): LinkCommand | undefined {
  if (value === null || value === undefined) {
    return undefined;
  } else if (typeof value === 'object' && 'command' in value) {
    return value;
  }

  return { command: value };
}
