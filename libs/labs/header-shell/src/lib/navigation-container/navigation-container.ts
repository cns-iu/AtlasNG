import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HeaderShellNavigationItem } from '../header-shell';
import { NavigationMenu } from '../navigation-menu/navigation-menu';

/**
 * Drawer container component containing the navigation menus
 */
@Component({
  selector: 'ang-navigation-container',
  imports: [MatSidenavModule, NavigationMenu],
  templateUrl: './navigation-container.html',
  styleUrl: './navigation-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationContainer {
  /** Navigation items for the left menu. */
  readonly navigationItems = input<HeaderShellNavigationItem[]>();
  /** Navigation items for the right menu. */
  readonly navRight = input<HeaderShellNavigationItem[]>();
  /** Email for the contact button. */
  readonly email = input<string>();
  /** List of supported social media IDs. */
  readonly socialMediaIds = input<string[]>([]);

  /** Opened state of the left navigation menu. */
  readonly leftMenuOpen = model(false);
  /** Opened state of the right navigation menu. */
  readonly rightMenuOpen = model(false);

  /**
   * Toggles the right navigation menu and ensures the left menu is closed.
   */
  appsMenuToggle() {
    this.rightMenuOpen.set(!this.rightMenuOpen());
    this.leftMenuOpen.set(false);
  }

  /**
   * Toggles the left navigation menu and ensures the right menu is closed.
   */
  localNavigationToggle() {
    this.leftMenuOpen.set(!this.leftMenuOpen());
    this.rightMenuOpen.set(false);
  }
}
