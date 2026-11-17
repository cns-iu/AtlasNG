import { Component } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AnalyticsPermissions } from '@atlasng/analytics/permissions';
import { CookieModal, CookieModalData } from '@atlasng/labs/cookie-modal';
import { HeaderShell, HeaderShellNavigationItem, NavigationContainer } from '@atlasng/labs/header-shell';
import { SkipToContentButton } from '@atlasng/labs/skip-to-content-button';

/** Header shell navigation items. */
const NAVIGATION_ITEMS: HeaderShellNavigationItem[] = [
  { id: 'home', label: 'Home', link: '/', icon: 'home' },
  { id: 'labs', label: 'Labs', link: '/labs', icon: 'science' },
  { id: 'github', label: 'GitHub', link: 'https://github.com/cns-iu/AtlasNG', icon: 'code', external: true },
];

/**
 * Renders the cookie modal inline instead of in a dialog, so its content is server rendered.
 * Dialogs open in an overlay outside the application root, which is not hydrated.
 */
@Component({
  selector: 'ang-inline-cookie-modal',
  imports: [CookieModal],
  template: '<ang-cookie-modal />',
  providers: [
    {
      provide: MAT_DIALOG_DATA,
      useValue: { permissions: AnalyticsPermissions.DEFAULT, logoSrc: 'logo.svg' } satisfies CookieModalData,
    },
    {
      provide: MatDialogRef,
      useValue: { id: 'inline-cookie-modal', disableClose: false, addPanelClass: () => undefined },
    },
  ],
})
export class InlineCookieModal {}

/**
 * Showcase page for `@atlasng/labs` components.
 */
@Component({
  selector: 'ang-labs-page',
  imports: [HeaderShell, InlineCookieModal, NavigationContainer, SkipToContentButton],
  template: `
    <ang-skip-to-content-button anchorId="main-content" />

    <ang-header-shell
      logoSrc="logo.svg"
      helpLink="/labs"
      localNavigation
      [navigationItems]="navigationItems"
      [localNavigationExpanded]="navigation.leftMenuOpen()"
      [localNavigationControls]="navigation.leftMenuId"
      [appsMenuExpanded]="navigation.rightMenuOpen()"
      [appsMenuControls]="navigation.rightMenuId"
      (localNavigationClick)="navigation.toggleLocalNavigation()"
      (appsMenuClick)="navigation.toggleAppsMenu()"
    />

    <ang-navigation-container
      email="info@example.com"
      [leftNavigationItems]="navigationItems"
      [rightNavigationItems]="navigationItems"
      [socials]="socials"
      #navigation
    >
      <h1>Labs</h1>
      <ang-inline-cookie-modal />
    </ang-navigation-container>
  `,
})
export class LabsPage {
  /** Header shell and navigation container items. */
  protected readonly navigationItems = NAVIGATION_ITEMS;

  /** Social media buttons in the navigation drawer. */
  protected readonly socials = ['github', 'linkedin'];
}
