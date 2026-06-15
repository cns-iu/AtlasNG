import { MatMenuModule } from '@angular/material/menu';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { HeaderShell } from './header-shell';

describe('HeaderShell', () => {
  it('closes local navigation when the viewport grows beyond 960px', async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 959 });

    try {
      await render(HeaderShell, {
        inputs: {
          hasLocalNavigation: true,
          localNavigationExpanded: true,
        },
      });

      expect(screen.getByRole('button', { name: 'Collapse local navigation' })).toBeInTheDocument();

      Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 961 });
      window.dispatchEvent(new Event('resize'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Expand local navigation' })).toBeInTheDocument();
      });
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: originalWidth });
    }
  });

  it('renders app switcher button by default', async () => {
    await render(
      `
        <mat-menu #appsMenu="matMenu">
          <button mat-menu-item type="button">App One</button>
        </mat-menu>

        <ang-header-shell [appsMenu]="appsMenu" />
      `,
      {
        imports: [HeaderShell, MatMenuModule],
      },
    );

    expect(screen.getByRole('button', { name: 'Open app switcher' })).toBeInTheDocument();
  });

  it('hides help button when disabled', async () => {
    await render(
      `
        <mat-menu #appsMenu="matMenu">
          <button mat-menu-item type="button">App One</button>
        </mat-menu>

        <ang-header-shell [appsMenu]="appsMenu" />
      `,
      {
        imports: [HeaderShell, MatMenuModule],
      },
    );

    expect(screen.queryByRole('button', { name: 'Open help menu' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open help page in a new tab' })).not.toBeInTheDocument();
  });

  it('shows help button when a help link is provided', async () => {
    await render(
      `
        <mat-menu #appsMenu="matMenu">
          <button mat-menu-item type="button">App One</button>
        </mat-menu>

        <ang-header-shell [appsMenu]="appsMenu" helpLink="/docs" />
      `,
      {
        imports: [HeaderShell, MatMenuModule],
      },
    );

    expect(screen.getByRole('link', { name: 'Open help page in a new tab' })).toBeInTheDocument();
  });

  it('toggles local navigation state when the menu button is clicked', async () => {
    const user = userEvent.setup();

    await render(
      `
        <mat-menu #appsMenu="matMenu">
          <button mat-menu-item type="button">App One</button>
        </mat-menu>

        <ang-header-shell
          [appsMenu]="appsMenu"
        />
      `,
      {
        imports: [HeaderShell, MatMenuModule],
      },
    );

    await user.click(screen.getByRole('button', { name: 'Expand local navigation' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Collapse local navigation' })).toBeInTheDocument();
    });
  });

  it('renders sidenav navigation items', async () => {
    await render(
      `
        <mat-menu #appsMenu="matMenu">
          <button mat-menu-item type="button">App One</button>
        </mat-menu>

        <ang-header-shell
          [appsMenu]="appsMenu"
          [navigationItems]="[
            { id: 'one', label: 'Section One', link: '/one' },
            { id: 'two', label: 'Section Two', link: '/two' }
          ]"
        />
      `,
      {
        imports: [HeaderShell, MatMenuModule],
      },
    );

    expect(screen.getAllByText('Section One').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Section Two').length).toBeGreaterThan(0);
  });
});
