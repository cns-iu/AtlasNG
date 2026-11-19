import { SearchListOption } from '@atlasng/design-system/search-list';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MultiSelectFilterChipList } from './multi-select-filter-chip-list';

describe('MultiSelectFilterChipList', () => {
  const liver: SearchListOption = { label: 'Liver', count: 10 };
  const kidney: SearchListOption = { label: 'Kidney', count: 5 };

  async function setup(inputs: Record<string, unknown> = {}) {
    const removed = vi.fn();
    const result = await render(MultiSelectFilterChipList, {
      inputs: { options: [liver], label: 'Active filters', removeLabel: 'Remove', ...inputs },
      on: { removed },
    });
    return { ...result, removed };
  }

  it('renders a labeled list with a chip per option', async () => {
    await setup({ options: [liver, kidney] });

    const list = screen.getByRole('list', { name: 'Active filters' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByRole('button', { name: 'Remove Kidney' })).toBeInTheDocument();
  });

  it('emits the option whose chip was removed', async () => {
    const user = userEvent.setup();
    const { removed } = await setup({ options: [liver, kidney] });

    await user.click(screen.getByRole('button', { name: 'Remove Kidney' }));

    expect(removed).toHaveBeenCalledWith(kidney);
  });
});
