import { fireEvent, render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { CSV_FILE_FORMAT, JSON_FILE_FORMAT, PDF_FILE_FORMAT } from './file-formats';
import { VersionControl, VersionControlFileFormat, VersionControlItem } from './version-control';

describe('VersionControl', () => {
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView;
    scrollIntoView.mockClear();
  });

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
    const download = vi.fn();
    const selectedVersionChange = vi.fn();
    const result = await render(VersionControl, {
      inputs: { tagline: 'Digital object version', versions: customVersions, selectedVersion },
      on: { download, selectedVersion: selectedVersionChange },
    });

    return { ...result, download, selectedVersionChange, user };
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

  it('scrolls the selected version into view when the select opens', async () => {
    const { user } = await setup(versions, versions[1]);

    await user.click(screen.getByRole('combobox', { name: 'Version' }));
    const option = await screen.findByRole('option', { name: '1.0.0' });

    await waitFor(() => expect(scrollIntoView.mock.contexts).toContain(option));
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'nearest' });
    expect(within(screen.getByRole('listbox', { name: 'Version' })).getAllByRole('option')).toHaveLength(2);
  });

  it('scrolls the highlighted version into view as the keyboard moves the highlight', async () => {
    const { user } = await setup();

    await user.click(screen.getByRole('combobox', { name: 'Version' }));
    const option = await screen.findByRole('option', { name: '1.0.0' });
    // Material reads the deprecated keyCode, which user-event does not set
    await fireEvent.keyDown(screen.getByRole('combobox', { name: 'Version' }), { key: 'ArrowDown', keyCode: 40 });

    await waitFor(() => expect(scrollIntoView.mock.contexts.at(-1)).toBe(option));
  });

  it('honors a supplied selected version', async () => {
    await setup(versions, versions[1]);

    expect(screen.getByRole('button', { name: /PDF/ })).toBeVisible();
  });

  it('emits the version and format when a format is chosen', async () => {
    const { download, user } = await setup();

    await user.click(screen.getByRole('button', { name: /JSON/ }));

    expect(download).toHaveBeenCalledExactlyOnceWith({ item: versions[0], format: versions[0].formats[1] });
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

  it('labels the version selector group with the tagline', async () => {
    await setup();

    const group = screen.getByRole('group', { name: 'Digital object version' });
    expect(within(group).getByRole('combobox', { name: /Version/ })).toBeInTheDocument();
  });

  it('uses custom version and download labels', async () => {
    await render(VersionControl, {
      inputs: { tagline: 'Release', versions, versionLabel: 'Ausgabe', downloadTagline: 'Downloads' },
    });

    expect(screen.getByRole('combobox', { name: /Ausgabe/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Downloads' })).toBeInTheDocument();
  });
});
