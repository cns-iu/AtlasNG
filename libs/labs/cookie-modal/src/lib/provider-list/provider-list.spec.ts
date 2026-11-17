import { render, screen } from '@testing-library/angular';
import { CookiePermissionProvider, ProviderList } from './provider-list';

describe('ProviderList', () => {
  async function setup(providers: CookiePermissionProvider[] = []) {
    return render(ProviderList, {
      inputs: {
        providers,
      },
    });
  }

  it('renders empty state when no providers are available', async () => {
    await setup();

    expect(screen.getByText('We do not use cookies or technology of this type')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders provider cards with accessible links', async () => {
    const providers: CookiePermissionProvider[] = [
      {
        label: 'YouTube',
        href: 'https://policies.google.com/privacy',
      },
      {
        label: 'Vimeo',
        href: 'https://vimeo.com/privacy',
      },
    ];

    await setup(providers);
    const links = screen.getAllByRole('link');

    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('Vimeo')).toBeInTheDocument();
    expect(links).toHaveLength(2);

    const firstLink = screen.getByRole('link', { name: 'Learn more about this provider YouTube' });
    const secondLink = screen.getByRole('link', { name: 'Learn more about this provider Vimeo' });

    expect(firstLink).toHaveAttribute('href', 'https://policies.google.com/privacy');
    expect(firstLink).toHaveAttribute('target', '_blank');
    expect(secondLink).toHaveAttribute('href', 'https://vimeo.com/privacy');
    expect(secondLink).toHaveAttribute('target', '_blank');
  });
});
