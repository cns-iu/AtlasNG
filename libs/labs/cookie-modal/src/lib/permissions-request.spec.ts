import { Component, inject } from '@angular/core';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import {
  AnalyticsPermissions,
  AnalyticsPermissionsManager,
  provideAnalyticsPermissionsManagerConfig,
  provideInitialAnalyticsPermissions,
} from '@atlasng/analytics/permissions';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideCookieModalPermissionsRequest } from './permissions-request';

@Component({
  selector: 'ang-permissions-request-host',
  template: `<button type="button" (click)="request()">Request marketing</button>`,
})
class PermissionsRequestHost {
  readonly manager = inject(AnalyticsPermissionsManager);

  request(): void {
    this.manager.requestCategories(AnalyticsEventCategory.Marketing);
  }
}

describe('provideCookieModalPermissionsRequest', () => {
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView;
    scrollIntoView.mockClear();
  });

  async function setup() {
    const user = userEvent.setup();
    const { fixture } = await render(PermissionsRequestHost, {
      providers: [
        provideInitialAnalyticsPermissions(AnalyticsPermissions.DEFAULT),
        provideAnalyticsPermissionsManagerConfig({ changeEventName: false, storage: false, storageEvents: false }),
        provideCookieModalPermissionsRequest({ logoSrc: 'logo.svg', logoLabel: 'Example logo' }),
      ],
    });

    await user.click(screen.getByRole('button', { name: 'Request marketing' }));

    return { manager: fixture.componentInstance.manager, user };
  }

  it('opens the cookie modal on the details tab with the requested categories toggled on', async () => {
    await setup();

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Example logo' })).toHaveAttribute('src', 'logo.svg');
    expect(screen.getByRole('tab', { name: 'Details', selected: true })).toBeInTheDocument();
    expect(await screen.findByRole('switch', { name: 'Disallow marketing cookies' })).toBeChecked();
  });

  it('scrolls the requested category into view', async () => {
    await setup();

    const marketingSwitch = await screen.findByRole('switch', { name: 'Disallow marketing cookies' });
    await waitFor(() => {
      expect(scrollIntoView.mock.contexts).toContain(marketingSwitch.closest('ang-cookie-permission-item'));
    });
  });

  it('grants the selection when the user allows it', async () => {
    const { manager, user } = await setup();

    await user.click(await screen.findByRole('button', { name: 'Allow Selection' }));

    await waitFor(() => {
      expect(manager.permissions().isCategoryEnabled(AnalyticsEventCategory.Marketing)).toBe(true);
    });
  });

  it('leaves permissions unchanged when the modal is closed', async () => {
    const { manager, user } = await setup();

    await user.click(await screen.findByRole('button', { name: 'Close cookie consent modal' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(manager.permissions().equals(AnalyticsPermissions.DEFAULT)).toBe(true);
    expect(manager.hasDecision()).toBe(false);
  });
});
