import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AnyLink } from '@atlasng/common';
import { SocialMediaButton } from '@atlasng/design-system/buttons/social-media';
import { HeaderShellNavigationItem } from '../header-shell';

/**
 * Menu used for navigation interactions across breakpoints, apps, and brands.
 */
@Component({
  selector: 'ang-navigation-menu',
  imports: [MatIconModule, MatSidenavModule, MatButtonModule, MatExpansionModule, AnyLink, SocialMediaButton],
  templateUrl: './navigation-menu.html',
  styleUrl: './navigation-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationMenu {
  /** Navigation items rendered in the desktop rail and mobile fallback. */
  readonly navigationItems = input<HeaderShellNavigationItem[]>();

  /** Optional email used for the contact button in the menu. */
  readonly email = input<string>();

  /** List of supported social media IDs. */
  protected readonly socialMediaIds = input(['linkedin', 'youtube', 'github', 'bluesky', 'instagram', 'facebook', 'x']);
}
