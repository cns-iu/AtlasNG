import {
  booleanAttribute,
  computed,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  Injector,
  input,
} from '@angular/core';
import type { ActivatedRoute, Params, QueryParamsHandling, UrlTree } from '@angular/router';
import { CUSTOM_ELEMENT_REGISTRY } from '@atlasng/core';
import { LinkAttributes, LinkCommand, LinkHandler } from './link-handler';
import { commandAttribute, isAnchorLikeElement, isUrlTree, safeMerge } from './utils';

/** Re-exported type for external usage with `AnyLink`. */
export type AnyLinkCommand = LinkCommand | UrlTree | string | readonly unknown[] | null | undefined;

/**
 * Generic navigation directive that works with both internal Angular routes and external URLs.
 */
@Directive({
  selector: '[angAnyLink]',
  host: {
    '[attr.href]': 'hrefAttribute()',
    '[attr.target]': 'targetAttribute()',
    '[attr.rel]': 'relAttribute()',
    '[attr.download]': 'downloadAttribute()',
    '[attr.tabindex]': 'tabIndexAttribute()',
    '(click)': 'onClick($event)',
  },
  exportAs: 'angAnyLink',
})
export class AnyLink {
  /** Primary link command input. */
  readonly command = input(undefined, { alias: 'angAnyLink', transform: commandAttribute });

  /** Optional browsing context target, e.g. `_blank`. */
  readonly target = input<string>();

  /** Optional `rel` attribute value forwarded to the rendered link. */
  readonly rel = input<string>();

  /** Optional `download` attribute value forwarded to the rendered link. */
  readonly download = input<string>();

  /** Router query params used when the command resolves to an Angular route. */
  readonly queryParams = input<Params | null>();

  /** Strategy for merging provided query params with the current URL query params. */
  readonly queryParamsHandling = input<QueryParamsHandling | null>();

  /** URL fragment to apply during navigation. */
  readonly fragment = input<string>();

  /** Preserves the current fragment when true. */
  readonly preserveFragment = input(false, { transform: booleanAttribute });

  /** Navigates without pushing a new browser history entry when true. */
  readonly skipLocationChange = input(false, { transform: booleanAttribute });

  /** Route used as a base for relative navigation commands. */
  readonly relativeTo = input<ActivatedRoute | null>();

  /** Optional browser-visible URL override for router navigation. */
  readonly browserUrl = input<UrlTree | string>();

  /** Replaces the current history entry instead of pushing a new one when true. */
  readonly replaceUrl = input(false, { transform: booleanAttribute });

  /** Optional history state object passed to the router. */
  readonly state = input<Record<string, unknown>>();

  /** Optional router navigation extras info payload. */
  readonly info = input<unknown>();

  /** Injector used to resolve optional dependencies while preparing navigation commands. */
  private readonly injector = inject(Injector);

  /** Host DOM element the directive is attached to. */
  private readonly element = inject(ElementRef).nativeElement as Element;

  /** Link orchestration service responsible for preparing and executing navigation. */
  private readonly handler = inject(LinkHandler);

  /** Initial static `href` attribute from the host element, if present. */
  private readonly initialHref = inject(new HostAttributeToken('href'), { optional: true });

  /** Initial static `tabindex` attribute from the host element, if present. */
  private readonly initialTabIndex = inject(new HostAttributeToken('tabindex'), { optional: true });

  /** Whether the host behaves as an anchor-like element for native link semantics. */
  private readonly isAnchorLikeElement = isAnchorLikeElement(this.element, inject(CUSTOM_ELEMENT_REGISTRY));

  /** Prepared link model derived from command inputs and current directive state. */
  private readonly preparedLink = computed(() => {
    const command = this.command();
    if (!command) {
      return undefined;
    }

    return this.handler.prepareLink(
      safeMerge(command, {
        queryParams: this.queryParams(),
        queryParamsHandling: this.queryParamsHandling(),
        fragment: this.fragment(),
        preserveFragment: this.preserveFragment(),
        relativeTo: this.relativeTo(),
      }),
      this.element,
      {
        target: this.target(),
        rel: this.rel(),
        download: this.download(),
      },
      this.injector,
    );
  });

  /** Resolved `href` host attribute value. */
  protected readonly hrefAttribute = computed(() => {
    if (!this.isAnchorLikeElement) {
      return this.initialHref;
    }

    return this.preparedLink()?.href;
  });

  /** Resolved `target` host attribute value. */
  protected readonly targetAttribute = computed(() => this.getAttributeValue('target'));

  /** Resolved `rel` host attribute value. */
  protected readonly relAttribute = computed(() => this.getAttributeValue('rel'));

  /** Resolved `download` host attribute value. */
  protected readonly downloadAttribute = computed(() => this.getAttributeValue('download'));

  /** Resolved `tabindex` host attribute value for keyboard accessibility on non-anchor hosts. */
  protected readonly tabIndexAttribute = computed(() => {
    if (this.initialTabIndex !== null || this.isAnchorLikeElement) {
      return this.initialTabIndex;
    }

    return this.preparedLink() ? '0' : null;
  });

  /**
   * Initializes the directive and asserts against invalid input combinations in development mode.
   */
  constructor() {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      effect(() => {
        if (
          isUrlTree(this.command()?.command) &&
          (this.queryParams() ||
            this.queryParamsHandling() ||
            this.fragment() !== undefined ||
            this.preserveFragment() ||
            this.relativeTo())
        ) {
          throw new Error(
            'Cannot configure queryParams or fragment when using a UrlTree as the angAnyLink input value.',
          );
        }
      });
    }
  }

  /**
   * Delegates click handling to `LinkHandler` when a command is configured.
   *
   * @param event Pointer event emitted by the host click interaction.
   * @returns `true` to keep default browser behavior, or `false` to suppress it.
   */
  protected onClick(event: PointerEvent): boolean {
    const link = this.preparedLink();
    if (!link) {
      return true;
    }

    const result = this.handler.navigateTo(link, event, {
      skipLocationChange: this.skipLocationChange(),
      browserUrl: this.browserUrl(),
      replaceUrl: this.replaceUrl(),
      state: this.state(),
      info: this.info(),
    });

    return result ?? !this.isAnchorLikeElement;
  }

  /**
   * Resolves an attribute value from prepared link metadata, falling back to direct input values.
   *
   * @param name Link attribute name to resolve.
   * @returns Resolved attribute value, `null`, or `undefined` when not provided.
   */
  private getAttributeValue(name: keyof LinkAttributes): string | null | undefined {
    const value = this.preparedLink()?.attributes?.[name];
    return value !== undefined ? value : this[name]();
  }
}
