import { screen } from '@testing-library/angular';
import { headerContext, renderDefinition } from '../testing/render-definition';
import { TextHeaderCellDefinition, type TextHeaderCellConfig } from './text-header-cell';

describe('TextHeaderCellDefinition', () => {
  it('renders aligned sortable header content with a sort trigger', async () => {
    await renderDefinition(TextHeaderCellDefinition, headerContext(), {
      config: { align: 'end' } satisfies TextHeaderCellConfig,
    });
    const header = screen.getByText('Name').parentElement;

    expect(header).toHaveClass('ang-table--header-sort-trigger', 'ang-table--text-header-align-end');
  });

  it('renders a non-interactive header for a static column', async () => {
    await renderDefinition(TextHeaderCellDefinition, headerContext({ column: { name: 'Static', sortable: false } }), {
      config: { align: 'center' } satisfies TextHeaderCellConfig,
    });
    const header = screen.getByText('Static').parentElement;

    expect(header).toHaveClass('ang-table--text-header-align-center');
    expect(header).not.toHaveClass('ang-table--header-sort-trigger');
  });
});
