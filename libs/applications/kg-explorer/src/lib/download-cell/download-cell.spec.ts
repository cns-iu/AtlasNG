import { Table, type TableColumn } from '@atlasng/design-system/table';
import { CSV_FILE_FORMAT, JSON_FILE_FORMAT } from '@atlasng/design-system/version-control';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { KgExplorerDownloadCellDefinition, type KgExplorerDownloadCellConfig } from './download-cell';

interface TestRow {
  name: string;
  title: string;
}

type LabelConfig =
  Pick<KgExplorerDownloadCellConfig<TestRow>, 'labelFn'> | Pick<KgExplorerDownloadCellConfig<TestRow>, 'labelProp'>;

const ROW: TestRow = { name: 'Ada', title: 'Heart atlas' };

describe('KgExplorerDownloadCellDefinition', () => {
  async function setup(
    formats: KgExplorerDownloadCellConfig<TestRow>['formats'] = [CSV_FILE_FORMAT, JSON_FILE_FORMAT],
    label: LabelConfig = { labelProp: 'title' },
  ) {
    const download = vi.fn();
    const columns: TableColumn<TestRow>[] = [
      {
        name: '',
        prop: 'name',
        cellTemplate: KgExplorerDownloadCellDefinition,
        cellConfig: { formats, download, ...label } as KgExplorerDownloadCellConfig<TestRow>,
      },
    ];
    const user = userEvent.setup();
    await render(Table<TestRow>, { inputs: { rows: [ROW], columns } });

    return { download, user };
  }

  it('names the menu button after the row and shows only the tooltip on hover', async () => {
    const { user } = await setup();

    const button = await screen.findByRole('button', { name: 'Choose download format for Heart atlas' });
    await user.hover(button);

    const tooltip = await screen.findByText('Choose download format', {
      ignore: '.cdk-describedby-message-container *',
    });
    expect(tooltip).toBeInTheDocument();
    expect(button).toHaveAccessibleDescription('Choose download format');
  });

  it('lists the file formats with their descriptions', async () => {
    const { user } = await setup();

    await user.click(await screen.findByRole('button', { name: 'Choose download format for Heart atlas' }));

    const menu = await screen.findByRole('menu');
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(2);
    expect(within(menu).getByText(CSV_FILE_FORMAT.label)).toBeInTheDocument();
    expect(within(menu).getByText(CSV_FILE_FORMAT.description as string)).toBeInTheDocument();
  });

  it('calls the download callback with the row and the picked format', async () => {
    const { download, user } = await setup();

    await user.click(await screen.findByRole('button', { name: 'Choose download format for Heart atlas' }));
    await user.click(await screen.findByRole('menuitem', { name: new RegExp(JSON_FILE_FORMAT.label) }));

    expect(download).toHaveBeenCalledWith(ROW, JSON_FILE_FORMAT);
  });

  it('resolves the formats of each row with a function', async () => {
    const formats = vi.fn((row: TestRow) => (row.name === 'Ada' ? [CSV_FILE_FORMAT, JSON_FILE_FORMAT] : []));
    const { user } = await setup(formats);

    await user.click(await screen.findByRole('button', { name: 'Choose download format for Heart atlas' }));

    expect(formats).toHaveBeenCalledWith(ROW);
    expect(within(await screen.findByRole('menu')).getAllByRole('menuitem')).toHaveLength(2);
  });

  it('downloads the only format of a row without a menu', async () => {
    const { download, user } = await setup([CSV_FILE_FORMAT]);

    await user.click(await screen.findByRole('button', { name: `Download Heart atlas as ${CSV_FILE_FORMAT.label}` }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(download).toHaveBeenCalledWith(ROW, CSV_FILE_FORMAT);
  });

  it('disables the button of a row without formats', async () => {
    const { download, user } = await setup(() => []);

    const button = await screen.findByRole('button', { name: 'No downloads available' });
    await user.click(button);

    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(download).not.toHaveBeenCalled();
  });

  it('names the buttons with the label function', async () => {
    const labelFn = vi.fn((row: TestRow) => row.name);
    await setup([CSV_FILE_FORMAT], { labelFn });

    expect(await screen.findByRole('button', { name: `Download Ada as ${CSV_FILE_FORMAT.label}` })).toBeInTheDocument();
    expect(labelFn).toHaveBeenCalledWith(ROW);
  });
});
