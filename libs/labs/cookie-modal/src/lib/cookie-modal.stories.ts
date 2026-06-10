import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Meta, StoryObj } from '@storybook/angular';
import { CookieModal, CookieModalData } from './cookie-modal';
import { AnalyticsEventCategory, AnalyticsEventCategoryPermissions } from '@atlasng/analytics/events';

const DEFAULT_PERMISSIONS: AnalyticsEventCategoryPermissions = {
  [AnalyticsEventCategory.Necessary]: true,
  [AnalyticsEventCategory.Preferences]: false,
  [AnalyticsEventCategory.Statistics]: false,
  [AnalyticsEventCategory.Marketing]: false,
};

@Component({
  imports: [MatButtonModule],
  template: `<button matButton="filled" (click)="open()">Open Cookie Modal</button>`,
})
class CookieModalStoryComponent {
  readonly activeTab = input<number>();
  readonly permissions = input<AnalyticsEventCategoryPermissions>(DEFAULT_PERMISSIONS);
  readonly result = output<unknown>();

  private readonly dialog = inject(MatDialog);
  private ref?: MatDialogRef<CookieModal>;

  open(): void {
    this.ref = this.dialog.open(CookieModal, {
      // width: '400px',
      data: {
        activeTab: this.activeTab(),
        permissions: this.permissions(),
      } satisfies CookieModalData,
    });

    this.ref.afterClosed().subscribe((value) => this.result.emit(value));
  }
}

const meta: Meta<CookieModalStoryComponent> = {
  title: 'Labs/CookieModal',
  component: CookieModalStoryComponent,
  subcomponents: [CookieModal],
};

export default meta;
type Story = StoryObj<CookieModalStoryComponent>;

export const Default: Story = {};
