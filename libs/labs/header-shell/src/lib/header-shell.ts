import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';
import { HelpButton } from '@atlasng/design-system/buttons/help';
import { NavigationButton } from '@atlasng/design-system/buttons/navigation';
import { SkipToContentButton } from '@atlasng/labs/skip-to-content-button';

/** Navigation item rendered in the shell navigation rail. */
export interface HeaderShellNavigationItem {
  /** Stable key used for rendering and state tracking. */
  id: string;
  /** Label shown to users in desktop and mobile navigation. */
  label: string;
  /** Optional link used when the item should route directly. */
  link?: AnyLinkCommand;
  /** Optional tooltip for navigation toggle items. */
  tooltip?: string;
  icon?: string;
}

/** Screen size breakpoint to disable desktop navigation (px). */
const DESKTOP_BREAKPOINT = 960;

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
    TrackClick,
    MatSidenavModule,
    MatFormFieldModule,
    MatDividerModule,
    SkipToContentButton,
  ],
  templateUrl: './header-shell.html',
  styleUrl: './header-shell.scss',
  providers: [provideEventScope('header-shell')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'closeLocalNavigationOnDesktop()',
  },
})
export class HeaderShell {
  /** Homepage destination used by the logo button. */
  readonly logoLink = input<AnyLinkCommand>('/');

  /** Image source URL used for the logo. */
  readonly logoUrl = input();

  /** Optional help link destination when the help button acts as a link. */
  readonly helpLink = input<AnyLinkCommand>();

  /** Navigation items rendered in the desktop rail and mobile fallback. */
  readonly navigationItems = input<HeaderShellNavigationItem[]>([]);

  /** Icon used by the local-left navigation toggle trigger. */
  readonly localNavigationIcon = input<'menu' | 'tune'>('menu');

  /** Whether the page has local navigation enabled. */
  readonly hasLocalNavigation = input(false);

  /** Current local navigation open/closed state. */
  readonly localNavigationExpanded = model(false);

  /** Emits each time the local navigation toggle button is pressed. */
  readonly localNavigationToggle = output();

  /** Emits each time the apps menu toggle button is pressed. */
  readonly appsMenuToggle = output();

  /**
   * Closes the local navigation menu if the window is resized above the desktop breakpoint
   * @returns local navigation on desktop
   */
  protected closeLocalNavigationOnDesktop(): void {
    if (!this.hasLocalNavigation() || window.innerWidth <= DESKTOP_BREAKPOINT) {
      return;
    }
    this.localNavigationExpanded.set(false);
  }
}
