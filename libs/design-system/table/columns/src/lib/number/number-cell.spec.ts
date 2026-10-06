import { screen } from '@testing-library/angular';
import { cellContext, renderDefinition } from '../testing/render-definition';
import { NumberCellDefinition } from './number-cell';

describe('NumberCellDefinition', () => {
  it('renders a localized number', async () => {
    await renderDefinition(NumberCellDefinition, cellContext({ value: 1234.5 }));

    expect(screen.getByText('1,234.5')).toHaveClass('ang-table--number-cell');
  });
});
