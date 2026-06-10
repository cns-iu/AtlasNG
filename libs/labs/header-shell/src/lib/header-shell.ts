import { ChangeDetectionStrategy, Component, input, model, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuPanel } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';
import { HelpButton } from '@atlasng/design-system/buttons/help';
import { NavigationButton } from '@atlasng/design-system/buttons/navigation';
import { NavigationToggle } from '@atlasng/design-system/buttons/navigation-toggle';

/** Navigation item rendered in the shell navigation rail. */
export interface HeaderShellNavigationItem {
  /** Stable key used for rendering and state tracking. */
  id: string;
  /** Label shown to users in desktop and mobile navigation. */
  label: string;
  /** Optional link used when the item should route directly. */
  link?: AnyLinkCommand;
  /** Optional menu used when the item should expand a menu. */
  menu?: MatMenuPanel<unknown>;
  /** Optional tooltip for navigation toggle items. */
  tooltip?: string;
}

// /** Metadata describing an icon action shown on the right side of the shell. */
// export interface HeaderShellIconAction {
//   /** Stable key used for rendering and action events. */
//   id: string;
//   /** Material icon name used for the action button. */
//   icon: string;
//   /** Accessible label announced for the action. */
//   ariaLabel: string;
//   /** Optional tooltip shown on hover/focus. */
//   tooltip?: string;
//   /** Optional link destination for link-based actions. */
//   link?: AnyLinkCommand;
//   /** Optional menu opened by this action. */
//   menu?: MatMenuPanel<unknown>;
//   /** Optional flag to hide the action without removing it from data sources. */
//   hidden?: boolean;
// }

/**
 * Sticky page header shell with responsive desktop/mobile navigation and dynamic icon action overflow.
 */
@Component({
  selector: 'ang-header-shell',
  imports: [
    AnyLink,
    HelpButton,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    NavigationButton,
    NavigationToggle,
    TrackClick,
    MatSidenavModule,
    MatFormFieldModule,
  ],
  templateUrl: './header-shell.html',
  styleUrl: './header-shell.scss',
  providers: [provideEventScope('header-shell')],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderShell {
  /** Homepage destination used by the logo button. */
  readonly logoLink = input<AnyLinkCommand>('/');
  readonly logoUrl = input('/');

  /** Navigation items rendered in the desktop rail and mobile fallback. */
  readonly navigationItems = input<HeaderShellNavigationItem[]>([]);

  /** Optional menu used for mobile consolidated navigation. */
  readonly mobileNavigationMenu = input<MatMenuPanel<unknown>>();

  // /** Label shown for the mobile navigation toggle trigger. */
  // readonly mobileNavigationLabel = input('Menu');

  // /** Whether a local-left navigation toggle should be displayed. */
  // readonly hasLocalNavigation = input(false);

  /** Icon used by the local-left navigation toggle trigger. */
  readonly localNavigationIcon = input<'menu' | 'tune'>('menu');

  /** Optional help link destination when the help button acts as a link. */
  readonly helpLink = input<AnyLinkCommand>();

  // /** Optional help menu attached to the help button trigger. */
  // readonly helpMenu = input<MatMenuPanel>();

  // /** App switcher menu. This action is always rendered on the far right. */
  // readonly appsMenu = input.required<MatMenuPanel<unknown>>();

  // /** Dynamic icon actions rendered before the app switcher. */
  // readonly iconActions = input<HeaderShellIconAction[]>([]);

  // /** Tooltip shown for the local-left navigation toggle trigger. */
  // readonly localNavigationTooltip = model('Toggle local navigation');

  /** Current local navigation open/closed state. */
  readonly localNavigationExpanded = model(false);

  // /** Current mobile navigation menu open state. */
  // readonly mobileNavigationExpanded = model(false);

  /** Emits each time the local navigation toggle button is pressed. */
  readonly localNavigationToggle = output();

  readonly appsMenuToggle = output();

  // /** Emits when a non-link, non-menu icon action is clicked. */
  // readonly iconActionClick = output<HeaderShellIconAction>();

  /** Tracks which top navigation menu is currently open. */
  readonly openedNavigationMenuId = signal<string | null>(null);

  // /** Header root used for layout measurement. */
  // private readonly barRef = viewChild<ElementRef<HTMLElement>>('bar');
  // /** Left section used for layout measurement. */
  // private readonly leftRef = viewChild<ElementRef<HTMLElement>>('left');
  // /** Desktop nav section used for layout measurement. */
  // private readonly desktopNavRef = viewChild<ElementRef<HTMLElement>>('desktopNav');
  // /** Mobile nav section used for layout measurement. */
  // private readonly mobileNavRef = viewChild<ElementRef<HTMLElement>>('mobileNav');
  // /** Fixed right section (help button) used for layout measurement. */
  // private readonly rightFixedRef = viewChild<ElementRef<HTMLElement>>('rightFixed');

  /** Sidenav instance used by the mobile local navigation toggle button. */
  // private readonly sidenav = viewChild<MatSidenav>('sidenav');

  /**
   * Synchronizes button aria-label state when sidenav open state changes.
   *
   * @param opened Whether the sidenav is currently opened.
   */
  handleSidenavOpenedChange(opened: boolean): void {
    this.localNavigationExpanded.set(opened);
  }

  // /** Count of icon actions that can be displayed before overflow. */
  // private readonly visibleIconActionCount = signal(Number.MAX_SAFE_INTEGER);

  // /** Width reserved for one icon button. */
  // private readonly iconButtonWidth = 48;
  // /** Spacing allowance between shell sections. */
  // private readonly sectionSpacingAllowance = 48;

  // /** Icon actions that are not hidden. */
  // readonly activeIconActions = computed(() => this.iconActions().filter((action) => !action.hidden));

  // /** Icon actions rendered directly as icon buttons. */
  // readonly visibleIconActions = computed(() => {
  //   const allActions = this.activeIconActions();
  //   const visibleCount = Math.max(0, Math.min(allActions.length, this.visibleIconActionCount()));
  //   return allActions.slice(0, visibleCount);
  // });

  // /** Icon actions rendered under the overflow "More" menu. */
  // readonly overflowIconActions = computed(() => {
  //   const allActions = this.activeIconActions();
  //   const visibleCount = Math.max(0, Math.min(allActions.length, this.visibleIconActionCount()));
  //   return allActions.slice(visibleCount);
  // });

  // /** Whether any icon actions are currently overflowed. */
  // readonly hasOverflowActions = computed(() => this.overflowIconActions().length > 0);

  // /**
  //  * Starts layout observers and keeps visible/overflow actions in sync with container width.
  //  */
  // constructor() {
  //   const ResizeObserver = inject(RESIZE_OBSERVER);
  //   const window = inject(DOCUMENT).defaultView;

  //   effect((onCleanup) => {
  //     const allActions = this.activeIconActions();

  //     const bar = this.barRef()?.nativeElement;
  //     const left = this.leftRef()?.nativeElement;
  //     const desktopNav = this.desktopNavRef()?.nativeElement;
  //     const mobileNav = this.mobileNavRef()?.nativeElement;
  //     const rightFixed = this.rightFixedRef()?.nativeElement;

  //     if (!bar || !left || !rightFixed) {
  //       this.visibleIconActionCount.set(allActions.length);
  //       return;
  //     }

  //     const recalculate = (): void => {
  //       this.recalculateVisibleIconActions(bar, left, desktopNav, mobileNav, rightFixed, allActions.length);
  //     };

  //     recalculate();

  //     if (ResizeObserver) {
  //       const resizeObserver = new ResizeObserver(() => {
  //         recalculate();
  //       });

  //       resizeObserver.observe(bar);
  //       resizeObserver.observe(left);
  //       resizeObserver.observe(rightFixed);

  //       if (desktopNav) {
  //         resizeObserver.observe(desktopNav);
  //       }

  //       if (mobileNav) {
  //         resizeObserver.observe(mobileNav);
  //       }

  //       onCleanup(() => {
  //         resizeObserver.disconnect();
  //       });
  //     }

  //     if (window) {
  //       window.addEventListener('resize', recalculate);

  //       onCleanup(() => {
  //         window.removeEventListener('resize', recalculate);
  //       });
  //     }
  //   });
  // }

  // /**
  //  * Toggles the local navigation state and notifies consumers.
  //  */
  // toggleLocalNavigation(): void {
  //   this.localNavigationExpanded.update((expanded) => !expanded);
  //   this.localNavigationToggle.emit(this.localNavigationExpanded());
  // }

  /**
   * Marks a top-level navigation menu as opened.
   *
   * @param id Stable navigation item id.
   */
  openNavigationMenu(id: string): void {
    this.openedNavigationMenuId.set(id);
  }

  /**
   * Clears top-level navigation menu state when the tracked menu closes.
   *
   * @param id Stable navigation item id.
   */
  closeNavigationMenu(id: string): void {
    if (this.openedNavigationMenuId() === id) {
      this.openedNavigationMenuId.set(null);
    }
  }

  // /**
  //  * Emits a click event for actionable icon buttons.
  //  *
  //  * @param action Action metadata describing the clicked button.
  //  */
  // emitIconActionClick(action: HeaderShellIconAction): void {
  //   this.iconActionClick.emit(action);
  // }

  // /**
  //  * Computes how many icon actions can stay visible before collapsing to "More".
  //  *
  //  * @param bar Header root element.
  //  * @param left Left section element.
  //  * @param desktopNav Desktop navigation section element.
  //  * @param mobileNav Mobile navigation section element.
  //  * @param rightFixed Right fixed section element.
  //  * @param totalActions Total number of candidate icon actions.
  //  */
  // private recalculateVisibleIconActions(
  //   bar: HTMLElement,
  //   left: HTMLElement,
  //   desktopNav: HTMLElement | undefined,
  //   mobileNav: HTMLElement | undefined,
  //   rightFixed: HTMLElement,
  //   totalActions: number,
  // ): void {
  //   if (totalActions === 0) {
  //     this.visibleIconActionCount.set(0);
  //     return;
  //   }

  //   const containerWidth = bar.clientWidth;

  //   // Keep all actions visible in test/non-layout contexts where dimensions are unavailable.
  //   if (containerWidth === 0) {
  //     this.visibleIconActionCount.set(totalActions);
  //     return;
  //   }

  //   const leftWidth = left.offsetWidth;
  //   const navWidth = this.getVisibleWidth(desktopNav) + this.getVisibleWidth(mobileNav);
  //   const rightFixedWidth = rightFixed.offsetWidth;
  //   const availableWidth =
  //     containerWidth - leftWidth - navWidth - rightFixedWidth - this.sectionSpacingAllowance - this.iconButtonWidth;

  //   if (availableWidth <= 0) {
  //     this.visibleIconActionCount.set(0);
  //     return;
  //   }

  //   let count = Math.floor(availableWidth / this.iconButtonWidth);
  //   count = Math.max(0, Math.min(count, totalActions));

  //   // Reserve one icon slot for the "More" trigger when there is overflow.
  //   if (count < totalActions && count > 0) {
  //     count -= 1;
  //   }

  //   this.visibleIconActionCount.set(count);
  // }

  // /**
  //  * Returns the width for visible elements and zero for hidden sections.
  //  *
  //  * @param element Section element that may be hidden by responsive styles.
  //  * @returns Width in pixels.
  //  */
  // private getVisibleWidth(element?: HTMLElement): number {
  //   if (!element || element.offsetParent === null) {
  //     return 0;
  //   }

  //   return element.offsetWidth;
  // }
}
