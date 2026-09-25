import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { FilterForm } from './filter-form';

describe('FilterForm', () => {
  const items = [
    { value: 'liver', label: 'Liver' },
    { value: 'kidney', label: 'Kidney' },
  ];
  const chips = [
    { value: 'liver', label: 'Liver' },
    { value: 'kidney', label: 'Kidney' },
  ];

  it('shows the info button when info text is provided', async () => {
    await render(FilterForm, {
      inputs: { category: 'Organ', info: 'About this filter' },
    });

    expect(screen.getByRole('button', { name: 'Info' })).toBeInTheDocument();
  });

  it('hides the info button when info text is omitted', async () => {
    await render(FilterForm, {
      inputs: { category: 'Organ' },
    });

    expect(screen.queryByRole('button', { name: 'Info' })).not.toBeInTheDocument();
  });

  it('renders the category button and unique item counter', async () => {
    await render(FilterForm, {
      inputs: { category: 'Organ', uniqueItemCount: 1000 },
    });

    expect(screen.getByRole('button', { name: 'Organ' })).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('opens the search list flyout and emits itemSelected when an item is chosen', async () => {
    const user = userEvent.setup();
    const onItemSelected = vi.fn();

    await render(FilterForm, {
      inputs: { category: 'Organ', items },
      on: { itemSelected: onItemSelected },
    });

    await user.click(screen.getByRole('button', { name: 'Organ' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Kidney' }));

    expect(onItemSelected).toHaveBeenCalledWith(items[1]);
  });

  it('renders chips for active filters and emits chipRemoved when one is removed', async () => {
    const user = userEvent.setup();
    const onChipRemoved = vi.fn();

    await render(FilterForm, {
      inputs: { category: 'Organ', chips },
      on: { chipRemoved: onChipRemoved },
    });

    const chip = screen.getByText('Liver').closest('mat-chip');
    expect(chip).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Liver' }));

    expect(onChipRemoved).toHaveBeenCalledWith(chips[0]);
  });

  it('does not render a divider when disabled', async () => {
    await render(FilterForm, {
      inputs: { category: 'Organ', showDivider: false },
    });

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
});
