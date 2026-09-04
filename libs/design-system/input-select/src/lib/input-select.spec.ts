import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { InputSelect, InputSelectOption } from './input-select';

describe('InputSelect', () => {
  const options: InputSelectOption[] = [
    { id: 'alpha', label: 'Alpha' },
    { id: 'beta', label: 'Beta' },
  ];

  /** Renders the search list with its default empty search term. */
  function setup() {
    return render(InputSelect, { inputs: { options } });
  }

  it('opens the options list when the search field is clicked', async () => {
    const user = userEvent.setup();
    await setup();

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();

    await user.click(screen.getByRole('textbox', { name: 'Search' }));

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('closes the options list when the search field loses focus', async () => {
    const user = userEvent.setup();
    await setup();
    const searchField = screen.getByRole('textbox', { name: 'Search' });

    await user.click(searchField);
    expect(screen.getByText('Alpha')).toBeInTheDocument();

    await user.tab();

    expect(searchField).not.toHaveFocus();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });
});
