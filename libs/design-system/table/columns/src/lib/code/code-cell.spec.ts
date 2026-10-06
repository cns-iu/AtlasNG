import { screen } from '@testing-library/angular';
import { cellContext, renderDefinition } from '../testing/render-definition';
import { CodeCellDefinition } from './code-cell';

describe('CodeCellDefinition', () => {
  it('renders the supplied cell value as inline code', async () => {
    await renderDefinition(CodeCellDefinition, cellContext({ value: 'npm install' }));

    const code = screen.getByText('npm install');
    expect(code.tagName).toBe('CODE');
    expect(code).toHaveClass('ang-table--code-cell');
  });
});
