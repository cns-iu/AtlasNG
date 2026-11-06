import { provideRouter, Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
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

  it('closes the local navigation drawer when one of its links is selected', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(NavigationContainer, {
      inputs: {
        navigationItems: [{ id: 'about', label: 'About', link: 'https://example.com/about', external: true }],
        leftMenuOpen: true,
      },
    });

    await user.click(screen.getByRole('link', { name: 'About' }));

    expect(fixture.componentInstance.leftMenuOpen()).toBe(false);
  });

  it('closes the apps drawer when one of its links is selected', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(NavigationContainer, {
      inputs: {
        navRight: [{ id: 'app', label: 'App', link: 'https://example.com/app', external: true }],
        rightMenuOpen: true,
      },
    });

    await user.click(screen.getByRole('link', { name: 'App' }));

    expect(fixture.componentInstance.rightMenuOpen()).toBe(false);
  });

  it('closes both drawers after a router navigation', async () => {
    const { fixture } = await render(NavigationContainer, {
      inputs: { leftMenuOpen: true, rightMenuOpen: true },
      providers: [provideRouter([{ path: 'other', children: [] }])],
    });

    await fixture.debugElement.injector.get(Router).navigateByUrl('/other');

    expect(fixture.componentInstance.leftMenuOpen()).toBe(false);
    expect(fixture.componentInstance.rightMenuOpen()).toBe(false);
  });
});
