import { screen } from '@testing-library/angular';
import { cellContext, renderDefinition } from '../testing/render-definition';
import { TextCellDefinition, type TextCellConfig } from './text-cell';

describe('TextCellDefinition', () => {
  it('renders the supplied cell value aligned to the start by default', async () => {
    await renderDefinition(TextCellDefinition, cellContext({ value: 'Ada' }));

    expect(screen.getByText('Ada')).toHaveClass('ang-table--text-cell', 'ang-table--text-cell-align-start');
  });

  it.each<NonNullable<TextCellConfig['align']>>(['start', 'center', 'end'])(
    'applies the configured %s alignment',
    async (align) => {
      await renderDefinition(TextCellDefinition, cellContext({ value: 'Ada' }), {
        config: { align } satisfies TextCellConfig,
      });

      expect(screen.getByText('Ada')).toHaveClass('ang-table--text-cell', `ang-table--text-cell-align-${align}`);
    },
  );
});
