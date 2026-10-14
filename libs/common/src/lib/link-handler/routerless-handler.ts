import { computed, DestroyRef, DOCUMENT, inject, Injector, Service, Signal, signal } from '@angular/core';
import type { IsActiveMatchOptions, NavigationBehaviorOptions } from '@angular/router';
import { CUSTOM_ELEMENT_REGISTRY, LOCATION } from '@atlasng/core';
import type { LinkAttributes, LinkCommand, LinkHandler, PreparedLink } from './handler';
import { isAnchorLikeElement } from './utils/anchor-element';
import { RouterlessCommandSerializer } from './utils/command-serializer';
import { isUrlActive } from './utils/compare-url';
import { isSafeNavigationUrl } from './utils/url';

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
 * Browser events after which the current URL is re-read for active-state tracking.
 */
const WINDOW_URL_CHANGE_EVENTS = ['popstate', 'hashchange'] as const;

/**
 * Default link handler that navigates through `window.location` without Angular Router navigation.
 *
 * Active state tracks the browser URL through `popstate` and `hashchange` events, the Navigation API's
 * `currententrychange` event when the browser supports it, and the handler's own navigations.
 */
@Service()
export class RouterlessLinkHandler implements LinkHandler<RouterlessPreparedLink> {
  /**
   * Browser location object used for hard navigations.
   */
  readonly #location = inject(LOCATION);

  /**
   * Optional registry for resolving custom elements that behave like anchors.
   */
  readonly #customElementRegistry = inject(CUSTOM_ELEMENT_REGISTRY);

  /**
   * Serializer used to turn routerless command inputs into browser URLs.
   */
  readonly #commandSerializer = inject(RouterlessCommandSerializer);

  /**
   * Current browser URL, refreshed whenever the browser reports a URL change.
   */
  readonly #currentUrl = signal(this.#location.href);

  /**
   * Starts tracking browser URL changes for reactive active-state checks.
   */
  constructor() {
    this.#listenForUrlChanges();
  }

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
   * URLs with a scheme outside the safe allowlist (for example `javascript:`) are ignored.
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
    } else if (!isSafeNavigationUrl(link.href)) {
      if (typeof ngDevMode === 'undefined' || ngDevMode) {
        // eslint-disable-next-line no-console
        console.warn(`Refusing to navigate to the unsafe URL "${link.href}".`);
      }

      return false;
    }

    if (options.replaceUrl) {
      this.#location.replace(link.href);
    } else {
      this.#location.assign(link.href);
    }

    this.#updateCurrentUrl();
    return false;
  }

  /**
   * Checks if a prepared link is active based on the current state.
   *
   * @param link Prepared link metadata.
   * @param matchOptions Options for matching the active state.
   * @returns A signal indicating if the link is active.
   */
  isActive(link: RouterlessPreparedLink, matchOptions?: Partial<IsActiveMatchOptions>): Signal<boolean> {
    const matchOptionsWithDefaults: IsActiveMatchOptions = {
      paths: 'subset',
      queryParams: 'subset',
      fragment: 'ignored',
      matrixParams: 'ignored',
      ...matchOptions,
    };

    return computed(() => isUrlActive(link.href, this.#currentUrl(), matchOptionsWithDefaults));
  }

  /**
   * Re-reads the browser URL into the current URL signal.
   */
  #updateCurrentUrl(): void {
    this.#currentUrl.set(this.#location.href);
  }

  /**
   * Registers browser listeners that refresh the current URL and removes them when the injector is destroyed.
   */
  #listenForUrlChanges(): void {
    const window = inject(DOCUMENT).defaultView;
    if (!window) {
      return;
    }

    const listener = () => this.#updateCurrentUrl();
    const navigation = (window as { navigation?: EventTarget }).navigation;
    for (const type of WINDOW_URL_CHANGE_EVENTS) {
      window.addEventListener(type, listener);
    }
    navigation?.addEventListener?.('currententrychange', listener);

    inject(DestroyRef).onDestroy(() => {
      for (const type of WINDOW_URL_CHANGE_EVENTS) {
        window.removeEventListener(type, listener);
      }
      navigation?.removeEventListener?.('currententrychange', listener);
    });
  }

  /**
   * Warns in development mode when router-only navigation options are used.
   *
   * @param name Unsupported option name.
   * @param value Option value to inspect.
   */
  #checkUnsupportedOption(name: string, value: unknown): void {
    if ((typeof ngDevMode === 'undefined' || ngDevMode) && value) {
      // eslint-disable-next-line no-console
      console.warn(`The "${name}" option is not supported in routerless navigation.`);
    }
  }
}
