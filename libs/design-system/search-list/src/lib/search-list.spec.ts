import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SearchList, SearchListOption } from './search-list';

const OPTIONS: SearchListOption[] = [
  {
    id: 'alpha',
    label: 'Alpha',
    description: 'First description',
    description2: 'Additional alpha details',
    count: 12,
  },
  {
    id: 'beta',
    label: 'Beta',
    description: 'Second description',
    count: 4,
  },
  { id: 'gamma', label: 'Gamma' },
];

interface SearchListInputs {
  disableRipple?: boolean;
  disableSearch?: boolean;
  search?: string;
  selected?: SearchListOption[];
}

describe('SearchList', () => {
  function setup(inputs: SearchListInputs = {}) {
    return render(SearchList<SearchListOption>, {
      inputs: { options: OPTIONS, ...inputs },
    });
  }

  it('renders each option with its count and descriptions', async () => {
    await setup();

    const alpha = screen.getByRole('option', { name: 'Toggle alpha' });
    expect(within(alpha).getByText('Alpha')).toBeVisible();
    expect(within(alpha).getByText('12')).toBeVisible();
    expect(within(alpha).getByText('First description')).toBeVisible();
    expect(within(alpha).getByText('Additional alpha details')).toBeVisible();

    const gamma = screen.getByRole('option', { name: 'Toggle gamma' });
    expect(within(gamma).getByText('Gamma')).toBeVisible();
    expect(within(gamma).queryByText(/description/i)).not.toBeInTheDocument();
  });

  it('filters options by label without regard to case', async () => {
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'BeTA');

    expect(screen.getByRole('option', { name: 'Toggle beta' })).toBeVisible();
    expect(screen.queryByRole('option', { name: 'Toggle alpha' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Toggle gamma' })).not.toBeInTheDocument();
  });

  it('hides the search field when search is disabled', async () => {
    await setup({ disableSearch: true });

    expect(screen.queryByRole('textbox', { name: 'Search' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(OPTIONS.length);
  });

  it('marks options from the selected input as selected', async () => {
    await setup({ selected: [OPTIONS[1]] });

    expect(screen.getByRole('option', { name: 'Toggle beta' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Toggle alpha' })).toHaveAttribute('aria-selected', 'false');
  });

  it('updates the selected model when options are toggled', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup();

    await user.click(screen.getByRole('option', { name: 'Toggle alpha' }));
    await user.click(screen.getByRole('option', { name: 'Toggle beta' }));

    expect(fixture.componentInstance.selected()).toEqual([OPTIONS[0], OPTIONS[1]]);
  });
});
