import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Navigation } from './navigation';

describe('Navigation', () => {
  async function setup(link: string | null = null) {
    const user = userEvent.setup();

    await render(`<ang-navigation [link]="link">Go to Docs</ang-navigation>`, {
      imports: [Navigation],
      componentProperties: {
        link,
      },
    });

    const button = screen.getByRole('button', { name: 'Go to Docs' });

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

  it('applies link to the button', async () => {
    const { button } = await setup('https://example.com');

    expect(button).toHaveAttribute('href', 'https://example.com');
  });
});
