import type { UrlTree } from '@angular/router';
import type { LinkCommand } from '../links/handler';
import { isUrlTree } from '../links/shared/url';

export type AnyLinkCommand = string | readonly unknown[] | UrlTree | LinkCommand | null | undefined;

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

export function commandAttribute(value: AnyLinkCommand): LinkCommand | undefined {
  if (value === null || value === undefined) {
    return undefined;
  } else if (typeof value === 'object' && 'command' in value) {
    return value;
  }

  return { command: value };
}
