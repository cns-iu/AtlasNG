import { Location } from '@angular/common';
import { ErrorHandler, inject, Injectable, Injector } from '@angular/core';
import { NavigationBehaviorOptions, Router, UrlTree } from '@angular/router';
import { CUSTOM_ELEMENT_REGISTRY } from '@atlasng/core';
import { LinkAttributes, LinkCommand, LinkHandler } from './handler';
import { RouterlessLinkHandler, RouterlessPreparedLink } from './routerless-handler';
import { isAnchorLikeElement } from './shared/anchor-element';
import { isUrlTree, tryParseAbsoluteUrl } from './shared/url';

export interface RouterPreparedLink extends RouterlessPreparedLink {
  urlTree?: UrlTree;
}

@Injectable({
  providedIn: 'root',
})
export class RouterLinkHandler implements LinkHandler<RouterPreparedLink> {
  readonly #customElementRegistry = inject(CUSTOM_ELEMENT_REGISTRY);

  readonly #router = inject(Router);

  readonly #location = inject(Location);

  readonly #errorHandler = inject(ErrorHandler);

  readonly #routerlessHandler = inject(RouterlessLinkHandler);

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
