import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NavigationButton } from './navigation';

describe('NavigationButton', () => {
  async function setup() {
    const user = userEvent.setup();

    await render(`<ang-navigation-button>Go to Docs</ang-navigation-button>`, {
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
});
