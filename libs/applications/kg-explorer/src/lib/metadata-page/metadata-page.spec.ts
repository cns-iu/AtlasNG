import {
  CSV_FILE_FORMAT,
  JSON_FILE_FORMAT,
  VersionControlFileFormat,
  VersionControlItem,
} from '@atlasng/design-system/version-control';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MetadataPage, MetadataSection } from './metadata-page';

describe('MetadataPage', () => {
  const sections: MetadataSection[] = [
    { title: 'Description', blocks: [{ type: 'text', content: 'A description of the entry.' }] },
    {
      title: 'License',
      blocks: [
        {
          type: 'text',
          content: [
            'Creative Commons Attribution 4.0 International (',
            { text: 'CC BY 4.0', link: 'https://creativecommons.org/licenses/by/4.0/', external: true },
            ')',
          ],
        },
      ],
    },
    { title: 'Publisher', blocks: [{ type: 'text', content: [{ text: 'Publisher Inc.', link: '/publisher' }] }] },
    { title: 'Tags', blocks: [{ type: 'chips', labels: ['Heart', 'Kidney'] }] },
  ];

  const versions: VersionControlItem<VersionControlFileFormat>[] = [
    { label: 'v1.0', formats: [CSV_FILE_FORMAT, JSON_FILE_FORMAT] },
  ];

  async function setup(inputs: Record<string, unknown> = {}) {
    const user = userEvent.setup();
    const download = vi.fn();
    const result = await render(MetadataPage, {
      inputs: {
        title: 'Metadata title',
        sections,
        breadcrumbs: [{ name: 'Home', command: '/' }, { name: 'Metadata title' }],
        icons: [{ src: 'icon.svg', alt: 'Organ icon' }],
        url: 'https://example.com/entry',
        versions,
        ...inputs,
      },
      on: { download },
    });

    return { ...result, download, user };
  }

  it('renders the title as the page heading', async () => {
    await setup();

    expect(screen.getByRole('heading', { level: 1, name: 'Metadata title' })).toBeVisible();
  });

  it('renders the breadcrumbs, icons, url and version control', async () => {
    await setup();

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Organ icon' })).toHaveAttribute('src', 'icon.svg');
    expect(screen.getByText('example.com/entry')).toBeVisible();
    expect(screen.getByText('Digital object version')).toBeVisible();
  });

  it('renders section titles as level 2 headings by default', async () => {
    await setup();

    for (const section of sections) {
      expect(screen.getByRole('heading', { level: 2, name: section.title })).toBeVisible();
    }
  });

  it('uses the configured section heading level', async () => {
    await setup({ sectionHeadingLevel: 3 });

    expect(screen.getByRole('heading', { level: 3, name: 'Description' })).toBeVisible();
  });

  it('places the version control after the first section', async () => {
    await setup();

    const description = screen.getByRole('heading', { name: 'Description' });
    const versionControl = screen.getByText('Digital object version');
    const license = screen.getByRole('heading', { name: 'License' });

    expect(description.compareDocumentPosition(versionControl)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(versionControl.compareDocumentPosition(license)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('renders text with inline links', async () => {
    await setup();

    expect(screen.getByText(/Creative Commons Attribution 4.0 International/)).toBeVisible();
    const external = screen.getByRole('link', { name: 'CC BY 4.0' });
    expect(external).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/');
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');

    const internal = screen.getByRole('link', { name: 'Publisher Inc.' });
    expect(internal).not.toHaveAttribute('target');
  });

  it('renders images', async () => {
    await setup({
      sections: [{ title: 'Description', blocks: [{ type: 'image', src: 'figure.png', alt: 'Figure of the entry' }] }],
    });

    expect(screen.getByRole('img', { name: 'Figure of the entry' })).toHaveAttribute('src', 'figure.png');
  });

  it('renders chips as a list', async () => {
    await setup();

    const chipList = screen.getAllByRole('list').find((list) => within(list).queryByText('Heart'));
    expect(chipList).toBeDefined();
    const chips = within(chipList as HTMLElement).getAllByRole('listitem');
    expect(chips.map((chip) => chip.textContent?.trim())).toEqual(['Heart', 'Kidney']);
  });

  it('hides parts that are turned off', async () => {
    await setup({ showBreadcrumbs: false, showIcons: false, showUrl: false });

    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Organ icon' })).not.toBeInTheDocument();
    expect(screen.queryByText('example.com/entry')).not.toBeInTheDocument();
    expect(screen.getByText('Digital object version')).toBeVisible();
  });

  it('hides parts without data but keeps the version control', async () => {
    await setup({ breadcrumbs: [], icons: [], url: undefined, versions: [], sections: [] });

    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Digital object version')).toBeVisible();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('uses the configured version control tagline', async () => {
    await setup({ versionControlTagline: 'Release' });

    expect(screen.getByText('Release')).toBeVisible();
  });

  it('emits download when a download option is chosen', async () => {
    const { download, user } = await setup();

    const options = screen.getByRole('group', { name: 'Download options' });
    await user.click(within(options).getByRole('button', { name: /CSV/ }));

    expect(download).toHaveBeenCalledWith({ item: versions[0], format: CSV_FILE_FORMAT });
  });
});
