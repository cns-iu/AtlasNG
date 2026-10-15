import { MatSnackBar } from '@angular/material/snack-bar';
import { createSnackBarConfig, Snackbar } from '@atlasng/design-system/snackbar';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { CSV_FILE_FORMAT, JSON_FILE_FORMAT, PDF_FILE_FORMAT } from './file-formats';
import { VersionControl, VersionControlFileFormat, VersionControlItem } from './version-control';

describe('VersionControl', () => {
  const versions: VersionControlItem<VersionControlFileFormat>[] = [
    {
      label: '2.0.0',
      formats: [CSV_FILE_FORMAT, JSON_FILE_FORMAT],
    },
    {
      label: '1.0.0',
      formats: [PDF_FILE_FORMAT],
    },
  ];

  async function setup(
    customVersions: VersionControlItem<VersionControlFileFormat>[] = versions,
    selectedVersion?: VersionControlItem<VersionControlFileFormat>,
  ) {
    const user = userEvent.setup();
    const openFromComponent = vi.fn();
    const download = vi.fn();
    const selectedVersionChange = vi.fn();
    const result = await render(VersionControl, {
      inputs: { tagline: 'Digital object version', versions: customVersions, selectedVersion },
      on: { download, selectedVersion: selectedVersionChange },
      providers: [{ provide: MatSnackBar, useValue: { openFromComponent } }],
    });

    return { ...result, download, openFromComponent, selectedVersionChange, user };
  }

  it('displays the tagline', async () => {
    await setup();

    expect(screen.getByText('Digital object version')).toBeVisible();
  });

  it('selects the first version and renders its formats by default', async () => {
    await setup();

    const options = screen.getByRole('group', { name: 'Download options' });
    expect(within(options).getByRole('button', { name: /CSV/ })).toBeVisible();
    expect(within(options).getByRole('button', { name: /JSON/ })).toBeVisible();
    expect(within(options).queryByRole('button', { name: /PDF/ })).not.toBeInTheDocument();
  });

  it('shows the supporting text supplied with each format', async () => {
    await setup([{ label: '3.0.0', formats: [{ label: 'ZIP', description: 'Compressed archive of every file.' }] }]);

    expect(screen.getByText('Compressed archive of every file.')).toBeVisible();
  });

  it('renders a format without supporting text when its description is empty', async () => {
    await setup([{ label: '3.0.0', formats: [{ label: 'ZIP', description: '' }] }]);

    expect(screen.getByRole('button', { name: 'ZIP' })).toBeVisible();
  });

  it('updates the formats and selected version when a different version is chosen', async () => {
    const { selectedVersionChange, user } = await setup();

    await user.click(screen.getByRole('combobox', { name: 'Version' }));
    await user.click(await screen.findByRole('option', { name: '1.0.0' }));

    expect(await screen.findByRole('button', { name: /PDF/ })).toBeVisible();
    expect(screen.queryByRole('button', { name: /CSV/ })).not.toBeInTheDocument();
    expect(selectedVersionChange).toHaveBeenCalledExactlyOnceWith(versions[1]);
  });

  it('honors a supplied selected version', async () => {
    await setup(versions, versions[1]);

    expect(screen.getByRole('button', { name: /PDF/ })).toBeVisible();
  });

  it('matches the supplied selected version by label', async () => {
    await setup(versions, { label: '1.0.0', formats: [] });

    expect(screen.getByRole('button', { name: /PDF/ })).toBeVisible();
  });

  it('falls back to the first version when the selected version is not found', async () => {
    await setup(versions, { label: '9.9.9', formats: [] });

    expect(screen.getByRole('button', { name: /CSV/ })).toBeVisible();
  });

  it('emits the version and format and displays a confirmation snackbar when a format is chosen', async () => {
    const { download, openFromComponent, user } = await setup();

    await user.click(screen.getByRole('button', { name: /JSON/ }));

    expect(download).toHaveBeenCalledExactlyOnceWith({ item: versions[0], format: versions[0].formats[1] });
    expect(openFromComponent).toHaveBeenCalledExactlyOnceWith(
      Snackbar,
      createSnackBarConfig('File downloaded', {
        duration: 5000,
        verticalPosition: 'top',
      }),
    );
  });

  it('does not render download options when the selected version has no formats', async () => {
    await setup([{ label: '3.0.0', formats: [] }]);

    expect(screen.queryByRole('group', { name: 'Download options' })).not.toBeInTheDocument();
    expect(screen.queryByText('Download options')).not.toBeInTheDocument();
  });

  it('disables version selection when no versions are supplied', async () => {
    await setup([]);

    expect(screen.getByRole('combobox', { name: 'Version' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('group', { name: 'Download options' })).not.toBeInTheDocument();
  });
});
