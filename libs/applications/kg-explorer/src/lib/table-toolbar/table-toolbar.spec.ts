import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { KgExplorerTableToolbar } from './table-toolbar';

describe('KgExplorerTableToolbar', () => {
  async function setup(inputs: Record<string, unknown> = {}) {
    const user = userEvent.setup();
    const result = await render(KgExplorerTableToolbar, {
      inputs: { count: 2, total: 3, suggestions: ['Heart atlas', 'Kidney atlas'], ...inputs },
    });

    const search = () => result.fixture.componentInstance.search();

    return { ...result, user, search };
  }

  it('shows the search field and the results counter', async () => {
    await setup();

    expect(screen.getByRole('combobox', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByText('Viewing 2 of 3')).toBeInTheDocument();
  });

  it('updates the search from typing, suggestions, and the clear button', async () => {
    const { user, search } = await setup();
    const input = screen.getByRole('combobox', { name: 'Search' });

    await user.type(input, 'a');
    expect(search()).toBe('a');

    await user.click(await screen.findByRole('option', { name: 'Heart atlas' }));
    expect(search()).toBe('Heart atlas');

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(search()).toBe('');
  });

  it('hides parts with the disabled inputs', async () => {
    await setup({ config: { searchDisabled: true, resultsCounterDisabled: true } });

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByText('Viewing 2 of 3')).not.toBeInTheDocument();
  });
});
