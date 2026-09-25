import { MatMenuModule } from '@angular/material/menu';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SearchList } from './search-list';

describe('SearchList', () => {
  const items = [
    { value: 'liver', label: 'Liver' },
    { value: 'kidney', label: 'Kidney' },
  ];

  it('renders an item for each entry', async () => {
    await render(SearchList, {
      imports: [MatMenuModule],
      inputs: { items },
    });

    expect(screen.getByRole('menuitem', { name: 'Liver' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Kidney' })).toBeInTheDocument();
  });

  it('shows an empty state when there are no items', async () => {
    await render(SearchList, {
      imports: [MatMenuModule],
      inputs: { items: [] },
    });

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('emits itemSelected when an item is clicked', async () => {
    const user = userEvent.setup();
    const onItemSelected = vi.fn();

    await render(SearchList, {
      imports: [MatMenuModule],
      inputs: { items },
      on: { itemSelected: onItemSelected },
    });

    await user.click(screen.getByRole('menuitem', { name: 'Kidney' }));

    expect(onItemSelected).toHaveBeenCalledWith(items[1]);
  });
});
