import { ErrorHandler, inject, Injectable, Injector } from '@angular/core';
import { ActivatedRoute, NavigationBehaviorOptions, Router, UrlTree } from '@angular/router';
import {
  LinkAttributes,
  LinkCommand,
  LinkHandler,
  PreparedLink,
  RouterlessLinkHandler,
  RouterlessLinkHandlerContext,
} from './link-handler';
import { canParseUrl, castArray, isUrlTree } from './utils';

/**
 * Context for router link handling.
 */
export interface RouterLinkHandlerContext extends RouterlessLinkHandlerContext {
  /**
   * Parsed router URL used for Angular Router navigation.
   *
   * Omitted when the link resolves to an absolute external URL.
   */
  urlTree?: UrlTree;
}

/**
 * Link handler that supports Angular Router commands and absolute URLs.
 */
@Injectable({
  providedIn: 'root',
})
export class RouterLinkHandler extends RouterlessLinkHandler implements LinkHandler<RouterLinkHandlerContext> {
  /** Angular Router instance used to build and execute route-based navigation. */
  protected readonly router = inject(Router);

  /** Centralized Angular error handler for async navigation failures. */
  protected readonly errorHandler = inject(ErrorHandler);

  /**
   * Prepares a link payload that supports both absolute URLs and Angular router commands.
   *
   * @param command Navigation command and URL creation options.
   * @param element Host element associated with the link.
   * @param attributes Optional link attributes from directive inputs.
   * @param injector Optional injector used to resolve `ActivatedRoute` for relative commands.
   * @returns Prepared link metadata used by `navigateTo`.
   */
  override prepareLink(
    command: LinkCommand,
    element?: Element,
    attributes?: LinkAttributes,
    injector?: Injector,
  ): PreparedLink<RouterLinkHandlerContext> {
    let href: string;
    let urlTree: UrlTree | undefined;

    if (typeof command.command === 'string' && canParseUrl(command.command)) {
      if (typeof ngDevMode === 'undefined' || ngDevMode) {
        if (command.relativeTo) {
          console.warn('The "relativeTo" option is not supported for absolute URLs in RouterLinkHandler.');
        }
      }

      const url = new URL(command.command);
      this.applyQueryParamsAndFragment(url, command);
      href = url.toString();
    } else {
      if (isUrlTree(command.command)) {
        urlTree = command.command;
      } else {
        const relativeTo = command.relativeTo ?? injector?.get(ActivatedRoute, null);
        urlTree = this.router.createUrlTree(castArray(command.command), { ...command, relativeTo });
      }

      const url = this.router.serializeUrl(urlTree);
      href = this.location.prepareExternalUrl(url);
    }

    return {
      href,
      attributes,
      handlerContext: {
        isAnchorLikeElement: this.isAnchorLikeElement(element),
        urlTree,
      },
    };
  }

  /**
   * Navigates to a prepared link using Angular Router when a `UrlTree` is available.
   *
   * Preserves native browser behavior for modified clicks and non-`_self` targets
   * on anchor-like hosts.
   *
   * @param link Prepared link metadata from `prepareLink`.
   * @param event Triggering DOM event.
   * @param options Angular Router navigation behavior options.
   * @returns `true` when native navigation should continue, otherwise `false`.
   */
  override navigateTo(
    link: PreparedLink<RouterLinkHandlerContext>,
    event: Event,
    options: NavigationBehaviorOptions,
  ): boolean {
    const { urlTree, isAnchorLikeElement } = link.handlerContext;
    if (!urlTree) {
      return super.navigateTo(link, event, options);
    }

    if (isAnchorLikeElement && event instanceof MouseEvent) {
      const { button, altKey, ctrlKey, metaKey, shiftKey } = event;
      if (button !== 0 || altKey || ctrlKey || metaKey || shiftKey) {
        return true;
      }

      const target = link.attributes?.target;
      if (target && target !== '_self') {
        return true;
      }
    }

    this.router.navigateByUrl(urlTree, options).catch((error) => {
      this.errorHandler.handleError(error);
    });

    return !isAnchorLikeElement;
  }

  /**
   * Applies query-param and fragment options from a link command onto an absolute URL.
   *
   * @param url Absolute URL instance to mutate.
   * @param command Link command containing query/fragment options.
   */
  private applyQueryParamsAndFragment(url: URL, command: LinkCommand): void {
    if (!command.queryParamsHandling && command.queryParams) {
      url.search = '';
    }
    if (command.queryParamsHandling !== 'preserve' && command.queryParams) {
      for (const [key, value] of Object.entries(command.queryParams)) {
        const values = castArray(value);
        url.searchParams.delete(key);
        for (const v of values) {
          url.searchParams.append(key, v);
        }
      }
    }

    if (!command.preserveFragment && command.fragment !== undefined) {
      url.hash = command.fragment;
    }
  }
}
