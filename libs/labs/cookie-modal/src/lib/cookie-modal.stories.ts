import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { AnalyticsPermissions } from '@atlasng/analytics/permissions';
import { Meta, StoryObj } from '@storybook/angular';
import 'storybook/test';
import { CookieModal, CookieModalData } from './cookie-modal';
import { CookiePermissionProvidersByCategory } from './provider-list/provider-list';

@Component({
  selector: 'ang-cookie-modal-story',
  imports: [MatButtonModule],
  template: `<button matButton="filled" (click)="open()">Open Cookie Modal</button>`,
})
class CookieModalStoryComponent {
  readonly logoSrc = input<string>();
  readonly logoLabel = input<string>();
  readonly permissions = input(AnalyticsPermissions.DEFAULT);
  readonly activeTab = input<number>();
  readonly providers = input<CookiePermissionProvidersByCategory>();
  readonly result = output<unknown>();

  private readonly dialog = inject(MatDialog);
  private ref?: MatDialogRef<CookieModal>;

  open(): void {
    this.ref = this.dialog.open(CookieModal, {
      data: {
        logoSrc: this.logoSrc(),
        logoLabel: this.logoLabel(),
        permissions: this.permissions(),
        activeTab: this.activeTab(),
        providers: this.providers(),
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

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const openButton = canvas.getByRole('button', { name: 'Open Cookie Modal' });
    await userEvent.click(openButton);
  },
};

/** Twelve providers per category, so the details tab overflows the dialog once a category is expanded. */
const MANY_PROVIDERS: CookiePermissionProvidersByCategory = Object.fromEntries(
  [AnalyticsEventCategory.Necessary, AnalyticsEventCategory.Statistics, AnalyticsEventCategory.Marketing].map(
    (category) => [
      category,
      Array.from({ length: 12 }, (_, index) => ({
        label: `Example provider ${index + 1}`,
        href: 'https://example.com',
      })),
    ],
  ),
);

export const ScrollingDetails: Story = {
  args: { activeTab: 1, providers: MANY_PROVIDERS },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open Cookie Modal' }));
  },
};
