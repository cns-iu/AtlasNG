import { Location } from '@angular/common';
import { inject, Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root',
})
export class RouterlessCommandSerializer {
  readonly #location = inject(Location);
  readonly #serializer = inject(UrlSerializer);

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
