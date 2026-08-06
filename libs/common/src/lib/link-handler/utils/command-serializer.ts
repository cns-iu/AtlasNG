import { Location } from '@angular/common';
import { inject, Service } from '@angular/core';
import {
  type ActivatedRoute,
  type Params,
  PRIMARY_OUTLET,
  type QueryParamsHandling,
  type UrlSegment,
  UrlSerializer,
  UrlTree,
} from '@angular/router';
import { LinkCommand } from '../handler';
import { applyQueryParamsAndFragmentToUrl, isUrlTree, tryParseAbsoluteUrl } from './url';

/**
 * Serializes router-style link commands without requiring Angular Router navigation.
 */
@Service()
export class RouterlessCommandSerializer {
  /**
   * Angular location service used for path inspection and external URL preparation.
   */
  readonly #location = inject(Location);

  /**
   * Angular URL serializer used for parsing and serializing `UrlTree` values.
   */
  readonly #serializer = inject(UrlSerializer);

  /**
   * Serializes a link command into an external URL string.
   *
   * Supports absolute URLs, `UrlTree` values, and simple command arrays. Does not
   * support all features of Angular Router command arrays, such as named outlets.
   *
   * @param command Navigation command and URL creation options.
   * @returns External URL ready for navigation.
   */
  serializeCommand(command: LinkCommand): string {
    const urlObj = tryParseAbsoluteUrl(command.command);
    if (urlObj) {
      applyQueryParamsAndFragmentToUrl(urlObj, command);
      return urlObj.toString();
    }

    const relativeTo = command.relativeTo ?? this.#serializer.parse(this.#location.path(true));
    const urlTree = this.commandToUrlTree(command, relativeTo);
    const url = this.#serializer.serialize(urlTree);
    return this.#location.prepareExternalUrl(url);
  }

  /**
   * Converts a `LinkCommand` into a `UrlTree`.
   *
   * @param command Navigation command and URL creation options.
   * @param relativeTo URL tree or activated route used as the base for relative commands.
   * @returns Normalized `UrlTree` for serialization.
   */
  commandToUrlTree(command: LinkCommand, relativeTo?: UrlTree | ActivatedRoute): UrlTree {
    const commandValue = command.command;
    if (isUrlTree(commandValue)) {
      return commandValue;
    }

    const commandArray = Array.isArray(commandValue) ? commandValue : [commandValue];
    const [currentSegments, currentQueryParams, currentFragment] = this.#getRelativeToState(relativeTo);
    const { queryParams: newQueryParams, queryParamsHandling, fragment: newFragment, preserveFragment } = command;
    const path = this.commandArrayToPath(commandArray, currentSegments);
    const queryParams = this.#selectQueryParams(currentQueryParams, newQueryParams ?? {}, queryParamsHandling);
    const fragment = this.#selectFragment(currentFragment, newFragment, preserveFragment);
    const urlTree = this.#serializer.parse(path);

    return new UrlTree(urlTree.root, queryParams, fragment);
  }

  /**
   * Converts a router command array into a URL path.
   *
   * @param command Command array to serialize.
   * @param segments Current path segments used as the base for relative commands.
   * @returns URL path beginning with `/`.
   */
  commandArrayToPath(command: readonly unknown[], segments: UrlSegment[] = []): string {
    const paths = segments.map((segment) => segment.path);
    let isFirstPath = true;

    for (const item of command) {
      const path = this.commandItemToPath(item);
      if (!path) {
        continue;
      } else if (isFirstPath && path.startsWith('/')) {
        paths.length = 0;
      }

      this.#appendPath(paths, path);
      isFirstPath = false;
    }

    return `/${paths.join('/')}`;
  }

  /**
   * Converts one command-array item into a path segment string.
   *
   * @param item Command item to normalize.
   * @returns Path segment string, or `undefined` when the item is unsupported or empty.
   */
  commandItemToPath(item: unknown): string | undefined {
    switch (typeof item) {
      case 'string':
      case 'number':
      case 'boolean':
      case 'bigint':
        return String(item);

      case 'object':
        if (item === null) {
          return undefined;
        } else if ('segmentPath' in item) {
          return String(item.segmentPath);
        } else if ('outlets' in item && (typeof ngDevMode === 'undefined' || ngDevMode)) {
          // eslint-disable-next-line no-console
          console.warn('Outlets in command arrays are not supported in routerless mode and will be skipped.');
        }

        return undefined;

      default:
        return undefined;
    }
  }

  /**
   * Reads path, query, and fragment state from the relative navigation base.
   *
   * @param relativeTo URL tree or activated route used as the relative base.
   * @returns Current path segments, query params, and fragment.
   */
  #getRelativeToState(
    relativeTo?: UrlTree | ActivatedRoute,
  ): [segments: UrlSegment[], queryParams: Params, fragment: string | null] {
    if (isUrlTree(relativeTo)) {
      const segments = relativeTo.root.children[PRIMARY_OUTLET]?.segments ?? [];
      return [segments, relativeTo.queryParams, relativeTo.fragment];
    } else if (relativeTo) {
      const snapshot = relativeTo.snapshot;
      return [snapshot.url, snapshot.queryParams, snapshot.fragment];
    }

    return [[], {}, null];
  }

  /**
   * Resolves query params according to Angular-style query param handling.
   *
   * @param currentParams Query params from the current relative URL.
   * @param newParams Query params from the command.
   * @param handling Query param merge or preserve strategy.
   * @returns Query params to apply to the resulting URL.
   */
  #selectQueryParams(
    currentParams: Params,
    newParams: Params,
    handling: QueryParamsHandling | null | undefined,
  ): Params {
    if (handling === 'preserve') {
      return currentParams;
    } else if (handling === 'merge') {
      return { ...currentParams, ...newParams };
    }

    return newParams;
  }

  /**
   * Resolves the fragment for the resulting URL.
   *
   * @param currentFragment Fragment from the current relative URL.
   * @param newFragment Fragment from the command.
   * @param preserve Whether to keep the current fragment.
   * @returns Fragment to apply to the resulting URL.
   */
  #selectFragment(
    currentFragment: string | null,
    newFragment: string | undefined,
    preserve: boolean | undefined,
  ): string | undefined {
    if (preserve) {
      return currentFragment ?? undefined;
    }

    return newFragment;
  }

  /**
   * Appends one path string to a mutable path segment list.
   *
   * Handles empty segments, `.`, and `..` similarly to router command arrays.
   *
   * @param paths Mutable path segment list.
   * @param path Path string to append.
   */
  #appendPath(paths: string[], path: string): void {
    for (const segment of path.split('/')) {
      if (!segment || segment === '.') {
        continue;
      }

      if (segment === '..') {
        paths.pop();
        continue;
      }

      paths.push(segment);
    }
  }
}
