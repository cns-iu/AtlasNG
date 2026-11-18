import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import { AnyLink } from '@atlasng/common';
import { SocialMediaButton, SocialMediaButtonDefinition } from '@atlasng/design-system/buttons/social-media-button';
import { HeaderShellNavigationItem } from '../header-shell';

/** Supported social media IDs */
const SOCIAL_MEDIA_IDS = ['linkedin', 'youtube', 'github', 'bluesky', 'instagram', 'facebook', 'x'];

/**
 * Menu used for navigation interactions across breakpoints, apps, and brands.
 */
@Component({
  selector: 'ang-navigation-menu',
  imports: [
    MatDividerModule,
    MatIconModule,
    MatSidenavModule,
    MatButtonModule,
    MatExpansionModule,
    AnyLink,
    SocialMediaButton,
    TrackClick,
  ],
  templateUrl: './navigation-menu.html',
  styleUrl: './navigation-menu.scss',
  providers: [provideEventScope('navigation-menu')],
})
export class NavigationMenu {
  /** Navigation items rendered in the desktop rail and mobile fallback. */
  readonly navigationItems = input<HeaderShellNavigationItem[]>();

  /** Optional email used for the contact button in the menu. */
  readonly email = input<string>();

  /** List of supported social media IDs. */
  readonly socials = input<(string | SocialMediaButtonDefinition)[]>(SOCIAL_MEDIA_IDS);

  /** Accessible name of the social media link group. */
  readonly socialsLabel = input('Social media links');

  /** Emits the navigation item whose link was activated, including links to the current page. */
  readonly linkClick = output<HeaderShellNavigationItem>();
}
