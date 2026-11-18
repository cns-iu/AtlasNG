import { Table, type TableColumn } from '@atlasng/design-system/table';
import { render, screen, within } from '@testing-library/angular';
import { KgExplorerDownloadHeaderCellDefinition } from './download-header-cell';

describe('KgExplorerDownloadHeaderCellDefinition', () => {
  it('names the header with the visually hidden column name', async () => {
    const columns: TableColumn[] = [
      { name: 'Download', prop: 'name', headerTemplate: KgExplorerDownloadHeaderCellDefinition },
    ];
    await render(Table, { inputs: { rows: [{ name: 'Ada' }], columns } });

    const header = await screen.findByRole('columnheader', { name: 'Download' });
    expect(within(header).getByText('Download')).toHaveClass('cdk-visually-hidden');
    expect(header).not.toHaveAttribute('title');
  });
});
