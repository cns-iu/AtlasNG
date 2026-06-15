import { render } from '@testing-library/angular';
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
