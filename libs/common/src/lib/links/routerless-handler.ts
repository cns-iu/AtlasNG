import { inject, Injectable, Injector } from '@angular/core';
import type { NavigationBehaviorOptions } from '@angular/router';
import { CUSTOM_ELEMENT_REGISTRY, LOCATION } from '@atlasng/core';
import type { LinkAttributes, LinkCommand, LinkHandler, PreparedLink } from './handler';
import { isAnchorLikeElement } from './shared/anchor-element';
import { RouterlessCommandSerializer } from './shared/command-serializer';

/**
 * Link metadata prepared by the default routerless handler.
 */
export interface RouterlessPreparedLink extends PreparedLink {
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
export class RouterlessLinkHandler implements LinkHandler<RouterlessPreparedLink> {
  /**
   * Browser location object used for hard navigations.
   */
  readonly #location = inject(LOCATION);

  /**
   * Optional registry for resolving custom elements that behave like anchors.
   */
  readonly #customElementRegistry = inject(CUSTOM_ELEMENT_REGISTRY);

  readonly #commandSerializer = inject(RouterlessCommandSerializer);

  /**
   * Builds a `PreparedLink` from the given command and element context.
   *
   * @param command Navigation command and URL creation options.
   * @param element Host element associated with the link.
   * @param attributes Optional link attributes.
   * @param _injector Unused injector placeholder for API parity.
   * @returns Prepared link metadata used by `navigateTo`.
   */
  prepareLink(
    command: LinkCommand,
    element?: Element,
    attributes?: LinkAttributes,
    _injector?: Injector,
  ): RouterlessPreparedLink {
    return {
      href: this.#commandSerializer.serializeCommand(command),
      attributes,
      isAnchorLikeElement: isAnchorLikeElement(element, this.#customElementRegistry),
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
  navigateTo(link: RouterlessPreparedLink, _event: Event, options: NavigationBehaviorOptions): boolean {
    this.#checkUnsupportedOption('skipLocationChange', options.skipLocationChange);
    this.#checkUnsupportedOption('state', options.state);
    this.#checkUnsupportedOption('browserUrl', options.browserUrl);

    if (link.isAnchorLikeElement) {
      return true;
    }

    if (options.replaceUrl) {
      this.#location.replace(link.href);
    } else {
      this.#location.assign(link.href);
    }

    return false;
  }

  #checkUnsupportedOption(name: string, value: unknown): void {
    if ((typeof ngDevMode === 'undefined' || ngDevMode) && value) {
      // eslint-disable-next-line no-console
      console.warn(`The "${name}" option is not supported in routerless navigation.`);
    }
  }
}
