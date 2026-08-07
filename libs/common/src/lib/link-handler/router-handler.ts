import { Location } from '@angular/common';
import { ErrorHandler, inject, Injector, Service, Signal } from '@angular/core';
import { isActive, IsActiveMatchOptions, NavigationBehaviorOptions, Router, UrlTree } from '@angular/router';
import { CUSTOM_ELEMENT_REGISTRY } from '@atlasng/core';
import { LinkAttributes, LinkCommand, LinkHandler } from './handler';
import { RouterlessLinkHandler, RouterlessPreparedLink } from './routerless-handler';
import { isAnchorLikeElement } from './utils/anchor-element';
import { isUrlTree, tryParseAbsoluteUrl } from './utils/url';

/**
 * Link metadata prepared by the Angular Router-aware handler.
 */
export interface RouterPreparedLink extends RouterlessPreparedLink {
  /**
   * Parsed router URL used for Angular Router navigation.
   *
   * Omitted when the command resolves to an absolute external URL.
   */
  urlTree?: UrlTree;
}

/**
 * Link handler that supports Angular Router commands while delegating absolute URLs to the routerless handler.
 */
@Service()
export class RouterLinkHandler implements LinkHandler<RouterPreparedLink> {
  /**
   * Optional registry for resolving custom elements that behave like anchors.
   */
  readonly #customElementRegistry = inject(CUSTOM_ELEMENT_REGISTRY);

  /**
   * Angular Router instance used to build and execute route-based navigation.
   */
  readonly #router = inject(Router);

  /**
   * Angular location service used to prepare browser-visible URLs.
   */
  readonly #location = inject(Location);

  /**
   * Angular error handler for reporting navigation failures.
   */
  readonly #errorHandler = inject(ErrorHandler);

  /**
   * Routerless fallback used for absolute URLs and hard navigations.
   */
  readonly #routerlessHandler = inject(RouterlessLinkHandler);

  /**
   * Prepares a link payload that supports both absolute URLs and Angular Router commands.
   *
   * @param command Navigation command and URL creation options.
   * @param element Host element associated with the link.
   * @param attributes Optional link attributes from directive inputs.
   * @param injector Optional injector used to resolve router state for relative commands.
   * @returns Prepared link metadata used by {@link navigateTo}.
   */
  prepareLink(
    command: LinkCommand,
    element?: Element,
    attributes?: LinkAttributes,
    injector?: Injector,
  ): RouterPreparedLink {
    if (tryParseAbsoluteUrl(command.command)) {
      return this.#routerlessHandler.prepareLink(command, element, attributes, injector);
    }

    const urlTree = this.#selectUrlTree(command, injector);
    const url = this.#router.serializeUrl(urlTree);
    return {
      href: this.#location.prepareExternalUrl(url),
      attributes,
      isAnchorLikeElement: isAnchorLikeElement(element, this.#customElementRegistry),
      urlTree,
    };
  }

  /**
   * Navigates to a prepared link using Angular Router when a `UrlTree` is available.
   *
   * Preserves native browser behavior for modified clicks, non-`_self` targets,
   * downloads, and absolute URLs delegated to the routerless handler.
   *
   * @param link Prepared link metadata from {@link prepareLink}.
   * @param event Triggering DOM event.
   * @param options Angular Router navigation behavior options.
   * @returns `true` when native navigation should continue, otherwise `false` or `void`.
   */
  navigateTo(link: RouterPreparedLink, event: Event, options: NavigationBehaviorOptions): boolean | void {
    const { attributes, urlTree } = link;
    if (!urlTree) {
      return this.#routerlessHandler.navigateTo(link, event, options);
    }

    if (link.isAnchorLikeElement && event instanceof MouseEvent) {
      const { button, altKey, ctrlKey, metaKey, shiftKey } = event;
      if (button !== 0 || altKey || ctrlKey || metaKey || shiftKey) {
        return true;
      }

      const target = link.attributes?.target;
      if (target && target !== '_self') {
        return true;
      }

      if (typeof attributes?.download === 'string') {
        return true;
      }
    }

    this.#router.navigateByUrl(urlTree, options).catch((error) => {
      this.#errorHandler.handleError(error);
    });

    return !link.isAnchorLikeElement;
  }

  /**
   * Checks if a prepared link is active based on the current state.
   *
   * @param link Prepared link metadata.
   * @param matchOptions Options for matching the active state.
   * @returns A signal indicating if the link is active.
   */
  isActive(link: RouterPreparedLink, matchOptions?: Partial<IsActiveMatchOptions>): Signal<boolean> {
    const { urlTree } = link;
    if (!urlTree) {
      return this.#routerlessHandler.isActive(link, matchOptions);
    }

    return isActive(urlTree, this.#router, matchOptions);
  }

  /**
   * Selects or creates the router URL tree represented by a command.
   *
   * @param command Navigation command and URL creation options.
   * @param injector Optional injector used to resolve the root route for relative commands.
   * @returns URL tree used for Angular Router navigation.
   */
  #selectUrlTree(command: LinkCommand, injector?: Injector): UrlTree {
    const commandValue = command.command;
    if (isUrlTree(commandValue)) {
      return commandValue;
    }

    const commandArray = Array.isArray(commandValue) ? commandValue : [commandValue];
    const relativeTo = command.relativeTo ?? injector?.get(Router).routerState.root;
    return this.#router.createUrlTree(commandArray, { ...command, relativeTo });
  }
}
