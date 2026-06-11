import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { CookiePermissionInfo, CookiePermissionItem } from './cookie-permission-item';

describe('CookiePermissionItem', () => {
  const baseInfo: CookiePermissionInfo = {
    category: AnalyticsEventCategory.Preferences,
    title: 'Preferences',
    description: 'Preference cookies remember your choices.',
  };

  async function setup(options?: {
    info?: CookiePermissionInfo;
    enabled?: boolean;
  }) {
    const user = userEvent.setup();
    const result = await render(CookiePermissionItem, {
      inputs: {
        info: options?.info ?? baseInfo,
        enabled: options?.enabled ?? false,
        providers: [
          {
            label: 'YouTube',
            href: 'https://policies.google.com/privacy',
          },
        ],
      },
    });

    return {
      ...result,
      user,
    };
  }

  it('renders title, description, and provider list content', async () => {
    const { user } = await setup();

    expect(screen.getByRole('button', { name: 'Preferences' })).toBeVisible();
    expect(screen.getByText('Preference cookies remember your choices.')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Preferences' }));

    expect(screen.getByText('YouTube')).toBeVisible();
    expect(screen.getByRole('link', { name: 'YouTube' })).toHaveAttribute(
      'href',
      'https://policies.google.com/privacy',
    );
  });

  it('toggles enabled state from the slide toggle and updates aria-label text', async () => {
    const { user } = await setup({ enabled: false });

    const toggle = screen.getByRole('switch', { name: 'Allow preferences cookies' });
    await user.click(toggle);

    expect(screen.getByRole('switch', { name: 'Disallow preferences cookies' })).toBeInTheDocument();
  });

  it('disables the state toggle when the category is required', async () => {
    await setup({
      info: {
        ...baseInfo,
        required: true,
      },
      enabled: true,
    });

    expect(screen.getByRole('switch', { name: 'Disallow preferences cookies' })).toBeDisabled();
  });

  it('manages expanded state through open, close, and toggle methods', async () => {
    const { fixture } = await setup();
    const component = fixture.componentInstance;
    const sectionToggle = screen.getByRole('button', { name: 'Preferences' });

    expect(sectionToggle).toHaveAttribute('aria-expanded', 'false');

    component.open();
    fixture.detectChanges();
    expect(sectionToggle).toHaveAttribute('aria-expanded', 'true');

    component.close();
    fixture.detectChanges();
    expect(sectionToggle).toHaveAttribute('aria-expanded', 'false');

    component.toggle();
    fixture.detectChanges();
    expect(sectionToggle).toHaveAttribute('aria-expanded', 'true');
  });
});
