import { screen, within } from '@testing-library/angular';
import { cellContext, renderDefinition } from '../testing/render-definition';
import { ChipCellDefinition, toChipLabels } from './chip-cell';

describe('ChipCellDefinition', () => {
  it('renders each array item as a chip in a list', async () => {
    await renderDefinition(ChipCellDefinition, cellContext({ value: ['Liver', 'Kidney'] }));

    const list = screen.getByRole('list');
    expect(list).toHaveClass('ang-table--chip-cell');
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.textContent?.trim())).toEqual(['Liver', 'Kidney']);
    expect(items[0]).toHaveClass('ang-table--chip-cell-item');
  });

  it('renders a single chip for a scalar value', async () => {
    await renderDefinition(ChipCellDefinition, cellContext({ value: 'Liver' }));

    expect(screen.getByRole('listitem')).toHaveTextContent('Liver');
  });

  it.each([undefined, null, '', []])('renders nothing for the empty value %j', async (value) => {
    await renderDefinition(ChipCellDefinition, cellContext({ value }));

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('toChipLabels', () => {
  it('stringifies items and skips empty values', () => {
    expect(toChipLabels(['a', null, undefined, '', 0, 1])).toEqual(['a', '0', '1']);
  });

  it('wraps scalar values', () => {
    expect(toChipLabels(42)).toEqual(['42']);
    expect(toChipLabels(null)).toEqual([]);
  });
});
