import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NoResults } from './no-results';

describe('NoResults', () => {
  it('should render description and label', async () => {
    await render(NoResults, {
      inputs: {
        description: 'Custom no results message',
        label: 'Custom label',
      },
    });

    expect(screen.getByText('Custom no results message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom label' })).toBeInTheDocument();
  });

  it('should emit clearClick on button click', async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    await render(NoResults, {
      on: {
        clearClick: click,
      },
    });

    const button = screen.getByRole('button', { name: /clear filters/i });
    await user.click(button);

    expect(click).toHaveBeenCalledOnce();
  });
});
