import { CSV_FILE_FORMAT, JSON_FILE_FORMAT } from '@atlasng/design-system/version-control';
import { Table, type TableColumn } from '@atlasng/design-system/table';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { KgExplorerDownloadCellDefinition, type KgExplorerDownloadCellConfig } from './download-cell';

interface TestRow {
  name: string;
}

describe('KgExplorerDownloadCellDefinition', () => {
  async function setup(
    formats: KgExplorerDownloadCellConfig<TestRow>['formats'] = [CSV_FILE_FORMAT, JSON_FILE_FORMAT],
  ) {
    const download = vi.fn();
    const columns: TableColumn<TestRow>[] = [
      {
        name: '',
        prop: 'name',
        cellTemplate: KgExplorerDownloadCellDefinition,
        cellConfig: { formats, download } satisfies KgExplorerDownloadCellConfig<TestRow>,
      },
    ];
    const user = userEvent.setup();
    await render(Table<TestRow>, { inputs: { rows: [{ name: 'Ada' }], columns } });

    return { download, user };
  }

  it('shows a tooltip on the download button', async () => {
    const { user } = await setup();

    await user.hover(await screen.findByRole('button', { name: 'Choose download format' }));

    expect(await screen.findByText('Choose download format')).toBeInTheDocument();
  });

  it('lists the file formats with their descriptions', async () => {
    const { user } = await setup();

    await user.click(await screen.findByRole('button', { name: 'Choose download format' }));

    const menu = await screen.findByRole('menu');
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(2);
    expect(within(menu).getByText(CSV_FILE_FORMAT.label)).toBeInTheDocument();
    expect(within(menu).getByText(CSV_FILE_FORMAT.description as string)).toBeInTheDocument();
  });

  it('calls the download callback with the row and the picked format', async () => {
    const { download, user } = await setup();

    await user.click(await screen.findByRole('button', { name: 'Choose download format' }));
    await user.click(await screen.findByRole('menuitem', { name: new RegExp(JSON_FILE_FORMAT.label) }));

    expect(download).toHaveBeenCalledWith({ name: 'Ada' }, JSON_FILE_FORMAT);
  });

  it('resolves the formats of each row with a function', async () => {
    const formats = vi.fn((row: TestRow) => (row.name === 'Ada' ? [CSV_FILE_FORMAT, JSON_FILE_FORMAT] : []));
    const { user } = await setup(formats);

    await user.click(await screen.findByRole('button', { name: 'Choose download format' }));

    expect(formats).toHaveBeenCalledWith({ name: 'Ada' });
    expect(within(await screen.findByRole('menu')).getAllByRole('menuitem')).toHaveLength(2);
  });

  it('downloads the only format of a row without a menu', async () => {
    const { download, user } = await setup([CSV_FILE_FORMAT]);

    await user.click(await screen.findByRole('button', { name: `Download ${CSV_FILE_FORMAT.label}` }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(download).toHaveBeenCalledWith({ name: 'Ada' }, CSV_FILE_FORMAT);
  });

  it('disables the button of a row without formats', async () => {
    const { download, user } = await setup(() => []);

    const button = await screen.findByRole('button', { name: 'No downloads available' });
    await user.click(button);

    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(download).not.toHaveBeenCalled();
  });
});
