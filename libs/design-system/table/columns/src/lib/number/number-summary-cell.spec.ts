import type { CellContext, Row } from '@atlasng/design-system/table';
import { screen } from '@testing-library/angular';
import { renderDefinition } from '../testing/render-definition';
import { NumberSummaryCellDefinition, type NumberSummaryCellConfig } from './number-summary-cell';

describe('NumberSummaryCellDefinition', () => {
  const rows = [{ score: 1000 }, { score: 234.5 }, { score: null }, { score: 'n/a' }];

  function setup(column: CellContext['column'], tableRows: Row[] | null = rows, config?: NumberSummaryCellConfig) {
    return renderDefinition(NumberSummaryCellDefinition, { column } as CellContext, {
      config,
      table: { rows: () => tableRows },
    });
  }

  it('sums numeric values and renders a localized number', async () => {
    await setup({ prop: 'score' });

    expect(screen.getByText('1,234.5')).toHaveClass('ang-table--number-cell');
  });

  it('applies the column summary function', async () => {
    await setup({ prop: 'score', summaryFunc: (cells: unknown[]) => cells.length * 1000 });

    expect(screen.getByText('4,000')).toBeInTheDocument();
  });

  it.each([
    ['a disabled summary function', { prop: 'score', summaryFunc: null }, rows],
    ['a column without a prop', {}, rows],
    ['missing rows', { prop: 'score' }, null],
    ['no numeric values', { prop: 'name' }, [{ name: 'Ada' }]],
  ])('renders an empty cell for %s', async (_, column, tableRows) => {
    const { container } = await setup(column, tableRows);

    expect(container.querySelector('.ang-table--number-cell')).toHaveTextContent(/^$/);
  });

  describe('configuration', () => {
    const mixedRows = [1000, '234.5', 'n/a', Infinity, null, ''].map((score) => ({ score }));

    it.each<[string, NumberSummaryCellConfig | undefined, Row[], string]>([
      ['skips non-number and non-finite cells by default', undefined, mixedRows, '1,000'],
      ['coerces numeric strings', { coerce: true }, mixedRows, '1,234.5'],
      ['includes infinite cells', { nonFinite: 'include' }, mixedRows, '∞'],
      ['includes failed coercions as NaN', { coerce: true, nonFinite: 'include' }, mixedRows, 'NaN'],
      ['includes NaN cells', { nonFinite: 'include' }, [{ score: 1 }, { score: NaN }], 'NaN'],
      [
        'skips empty cells when coercing and including',
        { coerce: true, nonFinite: 'include' },
        [{ score: 2 }, { score: null }, { score: '' }],
        '2',
      ],
    ])('%s', async (_, config, tableRows, expected) => {
      await setup({ prop: 'score' }, tableRows, config);

      expect(screen.getByText(expected)).toHaveClass('ang-table--number-cell');
    });

    it('ignores the configuration when the column supplies a summary function', async () => {
      await setup({ prop: 'score', summaryFunc: () => 7 }, mixedRows, { coerce: true, nonFinite: 'include' });

      expect(screen.getByText('7')).toBeInTheDocument();
    });
  });
});
