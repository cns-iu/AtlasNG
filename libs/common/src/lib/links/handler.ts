import { Injectable, Injector } from '@angular/core';
import type { NavigationBehaviorOptions, UrlCreationOptions, UrlTree } from '@angular/router';
import { RouterlessLinkHandler } from './routerless-handler';

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
  [TKey in keyof LinkAttributes]: LinkAttributes[TKey] | null;
};

/**
 * A link value resolved by a `LinkHandler`.
 *
 * Includes the final URL and optional DOM attributes.
 */
export interface PreparedLink {
  /**
   * Final navigation URL.
   */
  href: string;
  /**
   * Optional attributes to apply to the host element.
   */
  attributes?: NullableLinkAttributes;
}

/**
 * Base strategy for preparing and executing link navigation.
 */
@Injectable({
  providedIn: 'root',
  useExisting: RouterlessLinkHandler,
})
export abstract class LinkHandler<TLink extends PreparedLink = PreparedLink> {
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
  ): TLink;

  /**
   * Performs navigation for a previously prepared link.
   *
   * @param link Prepared link payload.
   * @param event Triggering DOM event.
   * @param options Navigation behavior options.
   * @returns `true` when native navigation should continue, `false` when handled internally,
   * or `void` for implementations that do not provide a continuation signal.
   */
  abstract navigateTo(link: TLink, event: Event, options: NavigationBehaviorOptions): boolean | void;
}
