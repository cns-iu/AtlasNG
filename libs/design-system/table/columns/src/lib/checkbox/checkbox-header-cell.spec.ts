import { signal } from '@angular/core';
import { screen } from '@testing-library/angular';
import { headerContext, renderDefinition, ROW } from '../testing/render-definition';
import { CheckboxHeaderCellDefinition } from './checkbox-header-cell';

describe('CheckboxHeaderCellDefinition', () => {
  it('reflects an indeterminate selection state', async () => {
    const table = { rows: signal([ROW, { name: 'Grace', url: '/grace' }]), selected: signal([ROW]) };
    await renderDefinition(CheckboxHeaderCellDefinition, headerContext({ allRowsSelected: false }), { table });

    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBePartiallyChecked();
  });

  it('reflects a checked selection state', async () => {
    const table = { rows: signal([ROW]), selected: signal([ROW]) };
    await renderDefinition(CheckboxHeaderCellDefinition, headerContext({ allRowsSelected: true }), { table });

    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeChecked();
  });

  it('forwards changes to the select-all callback', async () => {
    const selectFn = vi.fn();
    const table = { rows: signal([ROW]), selected: signal([]) };
    const { user } = await renderDefinition(CheckboxHeaderCellDefinition, headerContext({ selectFn }), { table });

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));

    expect(selectFn).toHaveBeenCalledOnce();
  });
});
