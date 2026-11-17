import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NavigationButton } from './navigation-button';

describe('NavigationButton', () => {
  async function setup() {
    const user = userEvent.setup();

    await render(`<ang-navigation-button link="/docs">Go to Docs</ang-navigation-button>`, {
      imports: [NavigationButton],
    });

    const button = screen.getByText('Go to Docs');

    return {
      user,
      button,
    };
  }

  it('renders projected content inside the navigation button', async () => {
    const { button } = await setup();

    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Go to Docs');
  });

  it('describes that the link opens in a new tab', async () => {
    await setup();

    expect(screen.getByRole('link', { name: 'Go to Docs' })).toHaveAccessibleDescription('Opens in a new tab');
  });

  it('forwards aria-label and aria-describedby to the link', async () => {
    await render(
      `<span id="hint">External site</span>
      <ang-navigation-button link="/docs" aria-label="Documentation" aria-describedby="hint">Docs</ang-navigation-button>`,
      { imports: [NavigationButton] },
    );

    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(link).toHaveAccessibleDescription('External site Opens in a new tab');
    expect(link.closest('ang-navigation-button')).not.toHaveAttribute('aria-label');
  });
});
