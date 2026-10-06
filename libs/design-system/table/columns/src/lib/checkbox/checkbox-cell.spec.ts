import { screen } from '@testing-library/angular';
import { cellContext, renderDefinition } from '../testing/render-definition';
import { CheckboxCellDefinition } from './checkbox-cell';

describe('CheckboxCellDefinition', () => {
  it('reflects checked and disabled context state', async () => {
    await renderDefinition(
      CheckboxCellDefinition,
      cellContext({ disabled: true, isSelected: true, onCheckboxChangeFn: vi.fn() }),
    );

    const checkbox = screen.getByRole('checkbox', { name: 'Select row' });
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
  });

  it('forwards checkbox clicks to the cell selection callback', async () => {
    const onCheckboxChangeFn = vi.fn();
    const { user } = await renderDefinition(CheckboxCellDefinition, cellContext({ onCheckboxChangeFn }));

    await user.click(screen.getByRole('checkbox', { name: 'Select row' }));

    expect(onCheckboxChangeFn).toHaveBeenCalledOnce();
  });
});
