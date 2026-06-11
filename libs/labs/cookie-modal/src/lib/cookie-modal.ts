import { ChangeDetectionStrategy, Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { EventScope, provideEventScope, TrackClick } from '@atlasng/analytics';
import {
  ALLOW_ALL_ANALYTICS_EVENT_CATEGORY_PERMISSIONS,
  ALLOW_NECESSARY_ANALYTICS_EVENT_CATEGORY_PERMISSIONS,
  AnalyticsEventCategoryPermissions,
} from '@atlasng/analytics/events';
import { CookiePermissions } from './cookie-permissions/cookie-permissions';
import { CookiePermissionProvidersByCategory } from './provider-list/provider-list';

/**
 * Input data required to initialize the cookie modal dialog.
 */
export interface CookieModalData {
  /**
   * Tab index that should be active when the modal opens.
   */
  activeTab?: number;

  /**
   * Initial analytics permissions.
   */
  permissions: AnalyticsEventCategoryPermissions;

  /**
   * Optional logo image source.
   */
  logoSrc?: string;

  /**
   * Accessible label for the optional logo.
   */
  logoLabel?: string;

  /**
   * Optional providers grouped by category for display in the details tab.
   */
  providers?: CookiePermissionProvidersByCategory;
}

/**
 * Result returned when the cookie modal closes.
 */
export type CookieModalResult = AnalyticsEventCategoryPermissions | undefined;

/**
 * Dialog component used to review and update cookie permissions.
 */
@Component({
  selector: 'ang-cookie-modal',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatDivider,
    MatIconModule,
    MatTabsModule,
    CookiePermissions,
    EventScope,
    TrackClick,
  ],
  templateUrl: './cookie-modal.html',
  styleUrl: './cookie-modal.scss',
  providers: [provideEventScope('cookie-modal')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-cookie-modal',
  },
})
export class CookieModal {
  /**
   * Reference to the hosting material dialog.
   */
  private readonly dialogRef = inject(MatDialogRef);

  /**
   * Data passed to the dialog when it is opened.
   */
  private readonly data = inject<CookieModalData>(MAT_DIALOG_DATA);

  /**
   * Active tab index shown in the modal.
   */
  protected readonly activeTab = signal(this.data.activeTab ?? 0);

  /**
   * Mutable permission state edited in the modal.
   */
  protected readonly permissions = signal(this.data.permissions);

  /**
   * Optional logo source rendered in the header.
   */
  protected readonly logoSrc = this.data.logoSrc;

  /**
   * Accessible label for the optional logo.
   */
  protected readonly logoLabel = this.data.logoLabel;

  /**
   * Providers grouped by category for the permissions view.
   */
  protected readonly providers = this.data.providers ?? {};

  /**
   * Predefined permission state that enables every category.
   */
  protected readonly allowAllPermissions = ALLOW_ALL_ANALYTICS_EVENT_CATEGORY_PERMISSIONS;

  /**
   * Predefined permission state that enables only required categories.
   */
  protected readonly allowNecessaryPermissions = ALLOW_NECESSARY_ANALYTICS_EVENT_CATEGORY_PERMISSIONS;

  /**
   * Indicates whether the modal backdrop close action is disabled.
   */
  protected get disableClose(): boolean {
    return this.dialogRef.disableClose ?? false;
  }

  /**
   * Adds a custom panel class for cookie modal-specific dialog styling.
   */
  constructor() {
    this.dialogRef.addPanelClass('ang-cookie-modal--panel');
  }
}
