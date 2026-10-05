import { screen } from '@testing-library/angular';
import { cellContext, renderDefinition } from '../testing/render-definition';
import { TextCellDefinition } from './text-cell';

describe('TextCellDefinition', () => {
  it('renders the supplied cell value', async () => {
    await renderDefinition(TextCellDefinition, cellContext({ value: 'Ada' }));

    expect(screen.getByText('Ada')).toHaveClass('ang-table--text-cell');
  });
});
