import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { AnalyticsEventCategoryPermissions } from '@atlasng/analytics/events';
import { CookiePermissions } from './cookie-permissions/cookie-permissions';
import { CookiePermissionProvidersByCategory } from './provider-list/provider-list';

export interface CookieModalData {
  activeTab?: number;
  permissions: AnalyticsEventCategoryPermissions;
  providers?: CookiePermissionProvidersByCategory;
}

@Component({
  selector: 'ang-cookie-modal',
  imports: [MatButtonModule, MatDialogModule, MatTabsModule, CookiePermissions],
  templateUrl: './cookie-modal.html',
  styleUrl: './cookie-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ang-cookie-modal',
  },
})
export class CookieModal {
  private readonly data = inject<CookieModalData>(MAT_DIALOG_DATA);

  protected readonly activeTab = signal(this.data.activeTab ?? 0);
  protected readonly permissions = signal(this.data.permissions);
  protected readonly providers = this.data.providers ?? {};
}
