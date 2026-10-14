import { screen } from '@testing-library/angular';
import { cellContext, renderDefinition, type TestRow } from '../testing/render-definition';
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

  it('names the checkbox by its one-based row number', async () => {
    await renderDefinition(CheckboxCellDefinition, cellContext({ rowIndex: 2, onCheckboxChangeFn: vi.fn() }));

    expect(screen.getByRole('checkbox', { name: 'Select row 3' })).toBeInTheDocument();
  });

  it('names the checkbox from a configured row property', async () => {
    await renderDefinition(CheckboxCellDefinition, cellContext({ rowIndex: 0, onCheckboxChangeFn: vi.fn() }), {
      config: { labelProp: 'name' },
    });

    expect(screen.getByRole('checkbox', { name: 'Select Ada' })).toBeInTheDocument();
  });

  it('names the checkbox with a configured label function', async () => {
    await renderDefinition(CheckboxCellDefinition, cellContext({ onCheckboxChangeFn: vi.fn() }), {
      config: { labelFn: (row: TestRow) => `${row.name} (${row.url})` },
    });

    expect(screen.getByRole('checkbox', { name: 'Select Ada (/ada)' })).toBeInTheDocument();
  });

  it('falls back to an empty label for a missing row property value', async () => {
    await renderDefinition(CheckboxCellDefinition, cellContext({ onCheckboxChangeFn: vi.fn() }), {
      config: { labelProp: 'missing' },
    });

    expect(screen.getByRole('checkbox', { name: 'Select' })).toBeInTheDocument();
  });
});
