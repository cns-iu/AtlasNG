import { ChangeDetectionStrategy, Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import {
  ALLOW_ALL_ANALYTICS_EVENT_CATEGORY_PERMISSIONS,
  ALLOW_NECESSARY_ANALYTICS_EVENT_CATEGORY_PERMISSIONS,
  AnalyticsEventCategoryPermissions,
} from '@atlasng/analytics/events';
import { CookiePermissions } from './cookie-permissions/cookie-permissions';
import { CookiePermissionProvidersByCategory } from './provider-list/provider-list';

export interface CookieModalData {
  activeTab?: number;
  permissions: AnalyticsEventCategoryPermissions;
  providers?: CookiePermissionProvidersByCategory;
}

export type CookieModalResult = AnalyticsEventCategoryPermissions | undefined;

@Component({
  selector: 'ang-cookie-modal',
  imports: [MatButtonModule, MatDialogModule, MatDivider, MatIconModule, MatTabsModule, CookiePermissions],
  templateUrl: './cookie-modal.html',
  styleUrl: './cookie-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-cookie-modal',
  },
})
export class CookieModal {
  private readonly dialogRef = inject(MatDialogRef);
  private readonly data = inject<CookieModalData>(MAT_DIALOG_DATA);

  protected readonly activeTab = signal(this.data.activeTab ?? 0);
  protected readonly permissions = signal(this.data.permissions);
  protected readonly providers = this.data.providers ?? {};

  protected allowAllPermissions = ALLOW_ALL_ANALYTICS_EVENT_CATEGORY_PERMISSIONS;
  protected allowNecessaryPermissions = ALLOW_NECESSARY_ANALYTICS_EVENT_CATEGORY_PERMISSIONS;

  protected get disableClose(): boolean {
    return this.dialogRef.disableClose ?? false;
  }

  constructor() {
    this.dialogRef.addPanelClass('ang-cookie-modal--panel');
  }
}
