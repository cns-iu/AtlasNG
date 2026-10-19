import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SearchList, SearchListOption } from './search-list';

const OPTIONS: SearchListOption[] = [
  {
    label: 'Alpha',
    description: ['First description', 'Additional alpha details'],
    count: 12,
  },
  {
    label: 'Beta',
    description: 'Second description',
    count: 4,
  },
  { label: 'Gamma' },
];

interface SearchListInputs {
  searchDisabled?: boolean;
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

    const alpha = screen.getByRole('option', { name: /^Alpha/ });
    expect(within(alpha).getByText('Alpha')).toBeVisible();
    expect(within(alpha).getByText('12')).toBeVisible();
    expect(within(alpha).getByText('First description')).toBeVisible();
    expect(within(alpha).getByText('Additional alpha details')).toBeVisible();

    const gamma = screen.getByRole('option', { name: /^Gamma/ });
    expect(within(gamma).getByText('Gamma')).toBeVisible();
    expect(within(gamma).queryByText(/description/i)).not.toBeInTheDocument();
  });

  it('filters options by label without regard to case', async () => {
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'BeTA');

    expect(screen.getByRole('option', { name: /^Beta/ })).toBeVisible();
    expect(screen.queryByRole('option', { name: /^Alpha/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /^Gamma/ })).not.toBeInTheDocument();
  });

  it('filters options by any description line without regard to case', async () => {
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'ALPHA DETAILS');

    expect(screen.getByRole('option', { name: /^Alpha/ })).toBeVisible();
    expect(screen.queryByRole('option', { name: /^Beta/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /^Gamma/ })).not.toBeInTheDocument();

    await user.clear(screen.getByRole('textbox', { name: 'Search' }));
    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'second');

    expect(screen.getByRole('option', { name: /^Beta/ })).toBeVisible();
    expect(screen.queryByRole('option', { name: /^Alpha/ })).not.toBeInTheDocument();
  });

  it('hides the search field when search is disabled', async () => {
    await setup({ searchDisabled: true });

    expect(screen.queryByRole('textbox', { name: 'Search' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(OPTIONS.length);
  });

  it('marks options from the selected input as selected', async () => {
    await setup({ selected: [OPTIONS[1]] });

    expect(screen.getByRole('option', { name: /^Beta/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: /^Alpha/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('includes the count and description in the option accessible name', async () => {
    await setup();

    expect(screen.getByRole('option', { name: /^Beta\s*4\s*Second description$/ })).toBeVisible();
  });

  it('keeps selections hidden by the search filter', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup();
    const search = screen.getByRole('textbox', { name: 'Search' });

    await user.click(screen.getByRole('option', { name: /^Alpha/ }));
    await user.type(search, 'beta');
    await user.click(screen.getByRole('option', { name: /^Beta/ }));

    expect(fixture.componentInstance.selected()).toEqual([OPTIONS[0], OPTIONS[1]]);

    await user.clear(search);

    expect(screen.getByRole('option', { name: /^Alpha/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: /^Beta/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: /^Gamma/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('removes only the deselected option while the filter is active', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup({ selected: [OPTIONS[0], OPTIONS[1]] });

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'beta');
    await user.click(screen.getByRole('option', { name: /^Beta/ }));

    expect(fixture.componentInstance.selected()).toEqual([OPTIONS[0]]);
  });

  it('updates the selected model when options are toggled', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup();

    await user.click(screen.getByRole('option', { name: /^Alpha/ }));
    await user.click(screen.getByRole('option', { name: /^Beta/ }));

    expect(fixture.componentInstance.selected()).toEqual([OPTIONS[0], OPTIONS[1]]);
  });
});
