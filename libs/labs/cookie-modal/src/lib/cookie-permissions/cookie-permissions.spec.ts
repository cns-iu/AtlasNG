import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { AnalyticsPermissions } from '@atlasng/analytics/permissions';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { CookiePermissions } from './cookie-permissions';

describe('CookiePermissions', () => {
  async function setup(options?: {
    permissions?: AnalyticsPermissions;
    providers?: Partial<Record<AnalyticsEventCategory, { label: string; href: string }[]>>;
  }) {
    const user = userEvent.setup();
    const result = await render(CookiePermissions, {
      inputs: {
        permissions: options?.permissions ?? AnalyticsPermissions.DEFAULT,
        providers: options?.providers ?? {},
      },
    });

    return {
      ...result,
      user,
    };
  }

  it('renders all default cookie categories', async () => {
    await setup();

    expect(screen.getByRole('button', { name: 'Necessary' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Preferences' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Statistics' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Marketing' })).toBeVisible();
  });

  it('updates permissions when a category switch is toggled', async () => {
    const { user } = await setup();

    const preferencesSwitch = screen.getByRole('switch', { name: 'Allow preferences cookies' });
    await user.click(preferencesSwitch);

    expect(screen.getByRole('switch', { name: 'Disallow preferences cookies' })).toBeInTheDocument();
  });

  it('forwards providers by category to each permission item', async () => {
    const { user } = await setup({
      providers: {
        [AnalyticsEventCategory.Marketing]: [
          {
            label: 'Vimeo',
            href: 'https://vimeo.com/privacy',
          },
        ],
      },
    });

    await user.click(screen.getByRole('button', { name: 'Marketing' }));

    const providerLink = screen.getByRole('link', { name: 'Vimeo' });
    expect(providerLink).toHaveAttribute('href', 'https://vimeo.com/privacy');
  });

  it('keeps necessary cookies required and not user-toggleable', async () => {
    await setup();

    expect(screen.getByRole('switch', { name: 'Disallow necessary cookies' })).toBeDisabled();
  });
});
