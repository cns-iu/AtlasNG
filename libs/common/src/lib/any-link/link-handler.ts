import { Location } from '@angular/common';
import { forwardRef, inject, Injectable, Injector } from '@angular/core';
import {
  type NavigationBehaviorOptions,
  PRIMARY_OUTLET,
  type UrlCreationOptions,
  UrlSerializer,
  UrlTree,
} from '@angular/router';
import { CUSTOM_ELEMENT_REGISTRY, LOCATION } from '@atlasng/core';
import {
  applyQueryParamsAndFragmentToUrl,
  castArray,
  isAnchorLikeElement,
  isUrlTree,
  tryParseAbsoluteUrl,
} from './utils';

/**
 * Command input for link preparation.
 *
 * Extends Angular URL creation options and adds the target route command.
 */
export interface LinkCommand extends UrlCreationOptions {
  /**
   * Route command represented as a path string, command array, or prebuilt `UrlTree`.
   */
  command: string | readonly unknown[] | UrlTree;
}

/**
 * Anchor-relevant attributes that can be applied to prepared links.
 */
export interface LinkAttributes {
  /**
   * Browser target for link navigation.
   */
  target?: string;
  /**
   * Relationship hint used for link security and semantics.
   */
  rel?: string;
  /**
   * Optional filename used for download behavior.
   */
  download?: string;
}

/**
 * Link attributes where each value may be `null`.
 *
 * `null` indicates that the attribute should be removed from the host element
 * instead of falling back to it's initial value.
 */
export type NullableLinkAttributes = {
  [K in keyof LinkAttributes]: LinkAttributes[K] | null;
};

/**
 * A link value resolved by a `LinkHandler`.
 *
 * Includes the final URL, optional DOM attributes, and handler-specific context.
 */
export interface PreparedLink<C = unknown> {
  /**
   * Final navigation URL.
   */
  href: string;
  /**
   * Optional attributes to apply to the host element.
   */
  attributes?: NullableLinkAttributes;
  /**
   * Handler-owned context used during navigation.
   */
  handlerContext: C;
}

/**
 * Base strategy for preparing and executing link navigation.
 */
@Injectable({
  providedIn: 'root',
  useExisting: forwardRef(() => RouterlessLinkHandler),
})
export abstract class LinkHandler<C = unknown> {
  /**
   * Resolves command and element inputs into a navigable link descriptor.
   *
   * @param command Navigation command and URL creation options.
   * @param element Host element associated with the link.
   * @param attributes Optional link attributes from directive inputs.
   * @param injector Optional injector for advanced handler scenarios.
   * @returns A prepared link payload consumed by `navigateTo`.
   */
  abstract prepareLink(
    command: LinkCommand,
    element?: Element,
    attributes?: LinkAttributes,
    injector?: Injector,
  ): PreparedLink<C>;

  /**
   * Performs navigation for a previously prepared link.
   *
   * @param link Prepared link payload.
   * @param event Triggering DOM event.
   * @param options Navigation behavior options.
   * @returns `true` when native navigation should continue, `false` when handled internally,
   * or `void` for implementations that do not provide a continuation signal.
   */
  abstract navigateTo(link: PreparedLink<C>, event: Event, options: NavigationBehaviorOptions): boolean | void;
}

/**
 * Runtime context returned by `RouterlessLinkHandler`.
 */
export interface RouterlessLinkHandlerContext {
  /**
   * Indicates whether the host element can use native anchor navigation.
   */
  isAnchorLikeElement: boolean;
}

/**
 * Default link handler that navigates through `window.location` without Angular Router navigation.
 */
@Injectable({
  providedIn: 'root',
})
export class RouterlessLinkHandler extends LinkHandler<RouterlessLinkHandlerContext> {
  /**
   * Browser location object used for hard navigations.
   */
  private readonly browserLocation = inject(LOCATION);

  /**
   * Optional registry for resolving custom elements that behave like anchors.
   */
  private readonly customElementRegistry = inject(CUSTOM_ELEMENT_REGISTRY);

  /**
   * Angular location service used for path inspection and external URL preparation.
   */
  protected readonly location = inject(Location);

  /**
   * Angular URL serializer used for parsing and serializing `UrlTree` values.
   */
  protected readonly serializer = inject(UrlSerializer);

  /**
   * Builds a `PreparedLink` from the given command and element context.
   *
   * @param command Navigation command and URL creation options.
   * @param element Host element associated with the link.
   * @param attributes Optional link attributes.
   * @param _injector Unused injector placeholder for API parity.
   * @returns Prepared link metadata used by `navigateTo`.
   */
  override prepareLink(
    command: LinkCommand,
    element?: Element,
    attributes?: LinkAttributes,
    _injector?: Injector,
  ): PreparedLink<RouterlessLinkHandlerContext> {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (command.relativeTo) {
        // eslint-disable-next-line no-console
        console.warn('The "relativeTo" option is not supported by RouterlessLinkHandler.');
      }
    }

    return {
      href: this.serializeCommand(command),
      attributes,
      handlerContext: {
        isAnchorLikeElement: this.isAnchorLikeElement(element),
      },
    };
  }

  /**
   * Navigates to a prepared link using native anchor behavior or `window.location`.
   *
   * @param link Prepared link to navigate to.
   * @param _event Triggering event (unused).
   * @param options Navigation behavior options.
   * @returns `true` when native navigation should continue, otherwise `false`.
   */
  override navigateTo(
    link: PreparedLink<RouterlessLinkHandlerContext>,
    _event: Event,
    options: NavigationBehaviorOptions,
  ): boolean {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (options.skipLocationChange) {
        // eslint-disable-next-line no-console
        console.warn('The "skipLocationChange" option is not supported by RouterlessLinkHandler.');
      }

      if (options.state) {
        // eslint-disable-next-line no-console
        console.warn('The "state" option is not supported by RouterlessLinkHandler.');
      }

      if (options.browserUrl) {
        // eslint-disable-next-line no-console
        console.warn('The "browserUrl" option is not supported by RouterlessLinkHandler.');
      }
    }

    if (link.handlerContext.isAnchorLikeElement) {
      return true;
    }

    if (options.replaceUrl) {
      this.browserLocation.replace(link.href);
    } else {
      this.browserLocation.assign(link.href);
    }

    return false;
  }

  /**
   * Checks if the given element behaves like an anchor element.
   *
   * @param element Element to check.
   * @returns `true` if the element behaves like an anchor; otherwise `false`.
   */
  protected isAnchorLikeElement(element: Element | undefined): boolean {
    return isAnchorLikeElement(element, this.customElementRegistry);
  }

  /**
   * Serializes a link command into an external URL string.
   *
   * Does not support all features of Angular's `Router` command arrays (e.g. outlets).
   *
   * @param command Navigation command and URL creation options.
   * @returns External URL ready for navigation.
   */
  protected serializeCommand(command: LinkCommand): string {
    const absoluteUrl = tryParseAbsoluteUrl(command.command);
    if (absoluteUrl) {
      applyQueryParamsAndFragmentToUrl(absoluteUrl, command);
      return absoluteUrl.toString();
    }

    const urlTree = this.commandToUrlTree(command);
    const url = this.serializer.serialize(urlTree);
    return this.location.prepareExternalUrl(url);
  }

  /**
   * Converts a `LinkCommand` into a `UrlTree`.
   *
   * @param command Navigation command and URL creation options.
   * @returns Normalized `UrlTree` for serialization.
   */
  private commandToUrlTree(command: LinkCommand): UrlTree {
    const value = command.command;
    if (isUrlTree(value)) {
      return value;
    }

    const currentUrlTree = this.serializer.parse(this.location.path(true));
    const { queryParamsHandling, preserveFragment } = command;
    let queryParams = command.queryParams ?? {};
    let fragment: string | null | undefined = command.fragment;

    if (queryParamsHandling === 'preserve') {
      queryParams = currentUrlTree.queryParams;
    } else if (queryParamsHandling === 'merge') {
      queryParams = { ...currentUrlTree.queryParams, ...queryParams };
    }

    if (preserveFragment) {
      fragment = currentUrlTree.fragment;
    }

    const path = this.commandToPath(castArray(value), currentUrlTree);
    const pathTree = this.serializer.parse(path);
    return new UrlTree(pathTree.root, queryParams, fragment);
  }

  /**
   * Converts a command array into a URL path.
   *
   * @param command Command array.
   * @param currentUrlTree Current URL tree.
   * @returns URL path.
   */
  private commandToPath(command: readonly unknown[], currentUrlTree: UrlTree): string {
    const currentSegments = currentUrlTree.root.children[PRIMARY_OUTLET]?.segments ?? [];
    const paths = currentSegments.map((segment) => segment.path);
    let isAbsolute = false;
    let isFirstPath = true;

    for (const part of command) {
      if (part === null || part === undefined) {
        continue;
      }

      let path = String(part);
      if (typeof part === 'object' && part !== null) {
        if ('segmentPath' in part) {
          path = String(part.segmentPath);
        } else {
          if ('outlets' in part && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            // eslint-disable-next-line no-console
            console.warn('Outlets in command arrays are not supported by RouterlessLinkHandler and will be skipped.');
          }

          continue;
        }
      }

      if (path.length === 0) {
        continue;
      }

      if (isFirstPath && path.startsWith('/')) {
        paths.length = 0;
        isAbsolute = true;
      }

      isFirstPath = false;

      for (const token of path.split('/')) {
        if (!token || token === '.') {
          continue;
        }

        if (token === '..') {
          paths.pop();
          continue;
        }

        paths.push(token);
      }
    }

    return isAbsolute || paths.length > 0 ? `/${paths.join('/')}` : '/';
  }
}
