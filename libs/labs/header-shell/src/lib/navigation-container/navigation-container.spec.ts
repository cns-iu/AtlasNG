import { render, screen } from '@testing-library/angular';
import { NavigationContainer } from './navigation-container';

describe('NavigationContainer', () => {
  it('renders projected content', async () => {
    await render('<ang-navigation-container><main>Page content</main></ang-navigation-container>', {
      imports: [NavigationContainer],
    });

    expect(screen.getByRole('main')).toHaveTextContent('Page content');
  });

  it('toggles the apps menu and closes the local navigation menu', async () => {
    const { fixture } = await render(NavigationContainer, {
      inputs: {
        leftMenuOpen: true,
        rightMenuOpen: false,
      },
    });

    fixture.componentInstance.appsMenuToggle();

    expect(fixture.componentInstance.rightMenuOpen()).toBe(true);
    expect(fixture.componentInstance.leftMenuOpen()).toBe(false);
  });

  it('toggles the local navigation menu and closes the apps menu', async () => {
    const { fixture } = await render(NavigationContainer, {
      inputs: {
        leftMenuOpen: false,
        rightMenuOpen: true,
      },
    });

    fixture.componentInstance.localNavigationToggle();

    expect(fixture.componentInstance.leftMenuOpen()).toBe(true);
    expect(fixture.componentInstance.rightMenuOpen()).toBe(false);
  });
});
