import { render, screen } from '@testing-library/angular';
import { NavigationMenu } from './navigation-menu';

describe('NavigationMenu', () => {
  it('should create', () => {
    expect(NavigationMenu).toBeTruthy();
  });

  it('renders navigation links from navigationItems input', async () => {
    const { container } = await render(NavigationMenu, {
      inputs: {
        navigationItems: [
          { id: 'home', label: 'Home', link: '/home' },
          { id: 'about', label: 'About', link: '/about' },
        ],
      },
    });

    const linkLabels = Array.from(
      container.querySelectorAll('.ang-navigation-menu-link .ang-navigation-menu-label'),
    ).map((label) => label.textContent?.trim());

    expect(linkLabels).toEqual(['Home', 'About']);
  });

  it('renders menu icon only for items that provide one', async () => {
    const { container } = await render(NavigationMenu, {
      inputs: {
        navigationItems: [
          { id: 'home', label: 'Home', link: '/home', icon: 'home' },
          { id: 'about', label: 'About', link: '/about' },
        ],
      },
    });

    const icons = container.querySelectorAll('.ang-navigation-menu-icon');
    expect(icons.length).toBe(1);
  });

  it('does not render dividers by default', async () => {
    await render(NavigationMenu, {
      inputs: {
        navigationItems: [
          { id: 'home', label: 'Home', link: '/home' },
          { id: 'about', label: 'About', link: '/about' },
        ],
      },
    });

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('renders a divider before items with divider enabled', async () => {
    await render(NavigationMenu, {
      inputs: {
        navigationItems: [
          { id: 'home', label: 'Home', link: '/home' },
          { id: 'contact', label: 'Contact Us', link: '/contact', divider: true },
        ],
      },
    });

    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(1);
    expect(separators[0].nextElementSibling).toBe(screen.getByRole('link', { name: 'Contact Us' }));
  });

  it('renders default social buttons and adds email button when email is provided', async () => {
    const { container, fixture } = await render(NavigationMenu);

    let socialButtons = container.querySelectorAll('ang-social-media-button');
    expect(socialButtons.length).toBe(7);

    fixture.componentRef.setInput('email', 'example@atlasng.dev');
    fixture.detectChanges();
    await fixture.whenStable();

    socialButtons = container.querySelectorAll('ang-social-media-button');
    expect(socialButtons.length).toBe(8);
  });
});
