import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NoResultsIndicator } from './no-results-indicator';

describe('NoResultsIndicator', () => {
  it('should render description and label', async () => {
    await render(NoResultsIndicator, {
      inputs: {
        description: 'Custom no results message',
        label: 'Custom label',
      },
    });

    expect(screen.getByText('Custom no results message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom label' })).toBeInTheDocument();
  });

  it('should emit clear on button click', async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    await render(NoResultsIndicator, {
      on: {
        clear: click,
      },
    });

    const button = screen.getByRole('button', { name: /clear filters/i });
    await user.click(button);

    expect(click).toHaveBeenCalledOnce();
  });
});
