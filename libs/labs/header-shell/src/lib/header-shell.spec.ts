import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { MatMenuModule } from '@angular/material/menu';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BehaviorSubject } from 'rxjs';
import { HeaderShell, HeaderShellAction } from './header-shell';

describe('HeaderShell', () => {
  it('observes the desktop breakpoint starting at exactly 960px', async () => {
    const observe = vi.fn(() => new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} }));
    await render(HeaderShell, { providers: [{ provide: BreakpointObserver, useValue: { observe } }] });

    expect(observe).toHaveBeenCalledWith('(min-width: 960px)');
  });

  it('closes local navigation when the viewport enters the desktop breakpoint', async () => {
    const state$ = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });
    await render(HeaderShell, {
      inputs: { hasLocalNavigation: true, localNavigationExpanded: true },
      providers: [{ provide: BreakpointObserver, useValue: { observe: () => state$ } }],
    });

    expect(screen.getByRole('button', { name: 'Collapse local navigation' })).toBeInTheDocument();

    state$.next({ matches: true, breakpoints: {} });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Expand local navigation' })).toBeInTheDocument();
    });
  });

  it('keeps local navigation expanded below the desktop breakpoint', async () => {
    const state$ = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });
    await render(HeaderShell, {
      inputs: { hasLocalNavigation: true, localNavigationExpanded: true },
      providers: [{ provide: BreakpointObserver, useValue: { observe: () => state$ } }],
    });

    state$.next({ matches: false, breakpoints: {} });

    expect(screen.getByRole('button', { name: 'Collapse local navigation' })).toBeInTheDocument();
  });

  it('does not render local navigation when disabled', async () => {
    await render(HeaderShell, {
      inputs: {
        hasLocalNavigation: false,
      },
    });

    expect(screen.queryByRole('button', { name: 'Expand local navigation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Collapse local navigation' })).not.toBeInTheDocument();
  });

  it('renders app switcher button by default', async () => {
    await render(
      `
        <mat-menu #appsMenu="matMenu">
          <button mat-menu-item type="button">App One</button>
        </mat-menu>

        <ang-header-shell />
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

        <ang-header-shell />
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

        <ang-header-shell helpLink="/docs" />
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
        <ang-header-shell
          [hasLocalNavigation]="true"
          [localNavigationExpanded]="expanded"
          (localNavigationToggle)="expanded = !expanded"
        />
      `,
      {
        imports: [HeaderShell, MatMenuModule],
        componentProperties: {
          expanded: false,
        },
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

  it('projects action buttons before the apps button', async () => {
    await render(
      `
        <ang-header-shell>
          <button angHeaderShellAction type="button" aria-label="Change theme">Theme</button>
        </ang-header-shell>
      `,
      { imports: [HeaderShell, HeaderShellAction] },
    );

    const action = screen.getByRole('button', { name: 'Change theme' });
    const apps = screen.getByRole('button', { name: 'Open app switcher' });

    expect(action).toHaveClass('ang-header-shell--action');
    expect(action.compareDocumentPosition(apps) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('does not project content without the action attribute', async () => {
    await render(
      `
        <ang-header-shell>
          <button type="button" aria-label="Unmarked">Unmarked</button>
        </ang-header-shell>
      `,
      { imports: [HeaderShell] },
    );

    expect(screen.queryByRole('button', { name: 'Unmarked' })).not.toBeInTheDocument();
  });
});
