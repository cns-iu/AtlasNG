import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialogConfig } from '@angular/material/dialog';
import { MatDialogHarness, MatTestDialogOpener } from '@angular/material/dialog/testing';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { AnalyticsPermissions } from '@atlasng/analytics/permissions';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { CookieModal, CookieModalData, CookieModalResult } from './cookie-modal';

describe('CookieModal', () => {
  async function setup(config?: MatDialogConfig<CookieModalData>) {
    const data: CookieModalData = {
      permissions: AnalyticsPermissions.DEFAULT,
      ...config?.data,
    };

    const openerType = MatTestDialogOpener.withComponent<CookieModal, CookieModalResult>(CookieModal, {
      ...config,
      data,
    });

    const user = userEvent.setup();
    const result = await render(openerType);

    const loader = TestbedHarnessEnvironment.documentRootLoader(result.fixture);
    const dialogHarness = await loader.getHarness(MatDialogHarness);

    return {
      ...result,
      user,
      dialogHarness,
      opener: result.fixture.componentInstance,
    };
  }

  it('opens with consent tab selected and default action buttons visible', async () => {
    const { dialogHarness } = await setup();

    expect(await dialogHarness.getRole()).toBe('dialog');
    expect(screen.getByRole('tab', { name: 'Consent', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Allow necessary only' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Customize' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Allow all' })).toBeInTheDocument();
  });

  it('switches to details tab when customize is clicked and shows allow selection action', async () => {
    const { user } = await setup();
    const customizeButton = screen.getByRole('button', { name: 'Customize' });

    await user.click(customizeButton);

    expect(screen.getByRole('tab', { name: 'Details', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Allow Selection' })).toBeVisible();
  });

  it('closes with allow-all permissions when allow all is clicked', async () => {
    const { opener, user } = await setup();
    const allowAllButton = screen.getByRole('button', { name: 'Allow all' });

    await user.click(allowAllButton);

    await waitFor(() => {
      expect(opener.closedResult).toEqual(AnalyticsPermissions.FULL);
    });
  });

  it('closes with updated selected permissions from details tab', async () => {
    const { opener, user } = await setup();

    await user.click(screen.getByRole('tab', { name: 'Details' }));

    const preferencesSwitch = await screen.findByRole('switch', { name: 'Allow preferences cookies' });
    await user.click(preferencesSwitch);

    const allowSelectionButton = screen.getByRole('button', { name: 'Allow Selection' });
    await user.click(allowSelectionButton);

    const result = AnalyticsPermissions.DEFAULT.enableCategory(AnalyticsEventCategory.Preferences);
    await waitFor(() => {
      expect(opener.closedResult).toEqual(result);
    });
  });

  it('does not render the close icon action when dialog closing is disabled', async () => {
    await setup({ disableClose: true });

    expect(screen.queryByRole('button', { name: 'Close cookie consent modal' })).not.toBeInTheDocument();
  });

  it('renders the close icon action when disableClose is explicitly undefined', async () => {
    await setup({ disableClose: undefined });

    expect(screen.getByRole('button', { name: 'Close cookie consent modal' })).toBeInTheDocument();
  });

  it('closes with allow-necessary permissions when allow necessary only is clicked', async () => {
    const { opener, user } = await setup();
    const allowNecessaryButton = screen.getByRole('button', { name: 'Allow necessary only' });

    await user.click(allowNecessaryButton);

    await waitFor(() => {
      expect(opener.closedResult).toEqual(AnalyticsPermissions.DEFAULT);
    });
  });
});
