import { MatSnackBar } from '@angular/material/snack-bar';
import { createSnackBarConfig, Snackbar } from '@atlasng/design-system/snackbar';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { FileFormatDescription, VersionControl, VersionControlVersion } from './version-control';

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
    vi.restoreAllMocks();
  });

  async function setup(customVersions = versions, selectedVersion?: string) {
    const user = userEvent.setup();
    const openFromComponent = vi.fn();
    const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const result = await render(VersionControl, {
      inputs: { versions: customVersions, fileFormats, selectedVersion },
      providers: [{ provide: MatSnackBar, useValue: { openFromComponent } }],
    });

    return { ...result, download, openFromComponent, user };
  }

  it('selects the first version and renders its download options by default', async () => {
    await setup();

    const options = screen.getByRole('group', { name: 'Download options' });
    expect(within(options).getByRole('button', { name: /CSV/ })).toHaveTextContent(
      'Spreadsheet-friendly data organized in rows and columns.',
    );
    expect(within(options).getByRole('button', { name: /JSON/ })).toBeVisible();
    expect(within(options).queryByRole('button', { name: /PDF/ })).not.toBeInTheDocument();
  });

  it('updates the download options when a different version is selected', async () => {
    const { user } = await setup();

    await user.click(screen.getByRole('combobox', { name: 'Version' }));
    await user.click(await screen.findByRole('option', { name: '1.0.0' }));

    expect(screen.getByRole('button', { name: /PDF/ })).toHaveTextContent(
      'Fixed-layout documents that preserve text, graphics, and formatting.',
    );
    expect(screen.queryByRole('button', { name: /CSV/ })).not.toBeInTheDocument();
  });

  it('honors a supplied selected version', async () => {
    await setup(versions, '1.0.0');

    expect(screen.getByRole('button', { name: /PDF/ })).toBeVisible();
  });

  it('starts the selected download and displays a confirmation snackbar', async () => {
    const { download, openFromComponent, user } = await setup();

    await user.click(screen.getByRole('button', { name: /CSV/ }));

    expect(download).toHaveBeenCalledOnce();
    expect(openFromComponent).toHaveBeenCalledWith(
      Snackbar,
      createSnackBarConfig('File downloaded', {
        duration: 2000,
        politeness: 'polite',
        verticalPosition: 'top',
      }),
    );
  });

  it('shows a download tooltip when an option receives focus', async () => {
    const { user } = await setup();

    await user.tab();
    await user.tab();

    expect(await screen.findByText('Download file', { selector: '.mat-mdc-tooltip-surface' })).toBeVisible();
  });

  it('renders a format without supporting text when no description is provided', async () => {
    await setup([{ version: '3.0.0', downloadOptions: [{ fileFormat: 'ZIP', downloadUrl: '/file.zip' }] }]);

    expect(screen.getByRole('button', { name: 'ZIP' })).toBeVisible();
  });
});
