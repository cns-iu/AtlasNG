import { MatMenuModule } from '@angular/material/menu';
import { render, screen } from '@testing-library/angular';
import { HelpButton } from './help';

describe('HelpButton', () => {
  it('renders as an external link when no menu is provided', async () => {
    await render(HelpButton, {
      inputs: {
        link: '/docs/help',
      },
    });

    const link = screen.getByRole('link', { name: 'Open help page in a new tab' });
    expect(link.getAttribute('href')).toContain('/docs/help');
  });

  it('renders as a menu trigger button when a menu is provided', async () => {
    await render(
      `
        <mat-menu #menu="matMenu">
          <button mat-menu-item type="button">Documentation</button>
        </mat-menu>
        <ang-help-button [menu]="menu" />
      `,
      {
        imports: [HelpButton, MatMenuModule],
      },
    );

    const button = screen.getByRole('button', { name: 'Open help menu' });
    expect(button).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open help page in a new tab' })).not.toBeInTheDocument();
  });
});
