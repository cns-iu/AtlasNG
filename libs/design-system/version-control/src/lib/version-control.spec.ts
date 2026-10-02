import { MatSnackBar } from '@angular/material/snack-bar';
import { createSnackBarConfig, Snackbar } from '@atlasng/design-system/snackbar';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { saveAs } from 'file-saver';
import { FileFormatDescription, VersionControl, VersionControlVersion } from './version-control';

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

describe('VersionControl', () => {
  const versions: readonly VersionControlVersion[] = [
    {
      version: '2.0.0',
      downloadOptions: [
        { fileFormat: 'CSV', downloadUrl: '/downloads/2.0.0.csv' },
        { fileFormat: 'JSON', downloadUrl: '/downloads/2.0.0.json' },
      ],
    },
    {
      version: '1.0.0',
      downloadOptions: [{ fileFormat: 'PDF', downloadUrl: '/downloads/1.0.0.pdf' }],
    },
  ];

  const fileFormats: readonly FileFormatDescription[] = [
    { fileFormat: 'CSV', supportingText: 'Spreadsheet-friendly data organized in rows and columns.' },
    { fileFormat: 'JSON', supportingText: 'Structured data for use in applications and workflows.' },
    { fileFormat: 'PDF', supportingText: 'Fixed-layout documents that preserve text, graphics, and formatting.' },
  ];

  afterEach(() => {
    vi.clearAllMocks();
  });

  async function setup(customVersions = versions, selectedVersion?: string) {
    const user = userEvent.setup();
    const openFromComponent = vi.fn();
    const result = await render(VersionControl, {
      inputs: { versions: customVersions, fileFormats, selectedVersion },
      providers: [{ provide: MatSnackBar, useValue: { openFromComponent } }],
    });

    return { ...result, openFromComponent, user };
  }

  it('selects the first version and renders its download options by default', async () => {
    await setup();

    const options = screen.getByRole('group', { name: 'Download options' });
    expect(within(options).getByRole('link', { name: /CSV/ })).toHaveTextContent(
      'Spreadsheet-friendly data organized in rows and columns.',
    );
    expect(within(options).getByRole('link', { name: /JSON/ })).toBeVisible();
    expect(within(options).queryByRole('link', { name: /PDF/ })).not.toBeInTheDocument();
  });

  it('updates the download options when a different version is selected', async () => {
    const { user } = await setup();

    await user.click(screen.getByRole('combobox', { name: 'Version' }));
    await user.click(await screen.findByRole('option', { name: '1.0.0' }));

    expect(screen.getByRole('link', { name: /PDF/ })).toHaveTextContent(
      'Fixed-layout documents that preserve text, graphics, and formatting.',
    );
    expect(screen.queryByRole('link', { name: /CSV/ })).not.toBeInTheDocument();
  });

  it('honors a supplied selected version', async () => {
    await setup(versions, '1.0.0');

    expect(screen.getByRole('link', { name: /PDF/ })).toBeVisible();
  });

  it('links each option to its download url', async () => {
    await setup();

    expect(screen.getByRole('link', { name: /CSV/ })).toHaveAttribute('href', '/downloads/2.0.0.csv');
    expect(screen.getByRole('link', { name: /JSON/ })).toHaveAttribute('download');
  });

  it('saves the selected file and displays a confirmation snackbar', async () => {
    const { openFromComponent, user } = await setup();

    await user.click(screen.getByRole('link', { name: /CSV/ }));

    expect(saveAs).toHaveBeenCalledExactlyOnceWith('/downloads/2.0.0.csv', '2.0.0.csv');
    expect(openFromComponent).toHaveBeenCalledWith(
      Snackbar,
      createSnackBarConfig('File downloaded', {
        duration: 5000,
        verticalPosition: 'top',
      }),
    );
  });

  it('does not render download options when the selected version has none', async () => {
    await setup([{ version: '3.0.0', downloadOptions: [] }]);

    expect(screen.queryByRole('group', { name: 'Download options' })).not.toBeInTheDocument();
    expect(screen.queryByText('Download options')).not.toBeInTheDocument();
  });

  it('disables version selection when no versions are supplied', async () => {
    await setup([]);

    expect(screen.getByRole('combobox', { name: 'Version' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('group', { name: 'Download options' })).not.toBeInTheDocument();
  });

  it('renders a format without supporting text when no description is provided', async () => {
    await setup([{ version: '3.0.0', downloadOptions: [{ fileFormat: 'ZIP', downloadUrl: '/file.zip' }] }]);

    expect(screen.getByRole('link', { name: 'ZIP' })).toBeVisible();
  });

  function createDownloadOptions(count: number) {
    return Array.from({ length: count }, (_, index) => ({
      fileFormat: `Format ${index + 1}`,
      downloadUrl: `/downloads/${index + 1}`,
    }));
  }

  it('does not make the download options scrollable with fewer than 12 options', async () => {
    await setup([{ version: '3.0.0', downloadOptions: createDownloadOptions(11) }]);

    expect(screen.getByRole('group', { name: 'Download options' })).not.toHaveClass('ang-version-control--scrollable');
  });

  it('makes the download options scrollable with 12 or more options', async () => {
    await setup([{ version: '3.0.0', downloadOptions: createDownloadOptions(12) }]);

    expect(screen.getByRole('group', { name: 'Download options' })).toHaveClass('ang-version-control--scrollable');
  });
});
