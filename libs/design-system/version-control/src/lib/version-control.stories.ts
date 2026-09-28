import { Meta, StoryObj } from '@storybook/angular';
import { parse } from 'yaml';
import { FileFormatDescription, VersionControl, VersionControlVersion } from './version-control';

/** Shape of the Storybook file-format fixture. */
interface FileFormatsAsset {
  /** File formats and their supporting copy. */
  fileFormats: FileFormatDescription[];
}

/** Example versions whose available formats differ. */
const VERSIONS: readonly VersionControlVersion[] = [
  {
    version: '2.0.0',
    downloadOptions: [
      { fileFormat: 'CSV', downloadUrl: 'data:text/csv;charset=utf-8,name%0AAtlasNG' },
      { fileFormat: 'JSON-LD (graph data)', downloadUrl: 'data:application/ld+json;charset=utf-8,%7B%7D' },
      { fileFormat: 'PDF', downloadUrl: 'data:application/pdf;charset=utf-8,AtlasNG' },
    ],
  },
  {
    version: '1.0.0',
    downloadOptions: [
      { fileFormat: 'JSON', downloadUrl: 'data:application/json;charset=utf-8,%7B%7D' },
      { fileFormat: 'TSV', downloadUrl: 'data:text/tab-separated-values;charset=utf-8,name%09AtlasNG' },
    ],
  },
];

/** Loads file-format descriptions from the public Storybook asset. */
async function loadFileFormats(): Promise<FileFormatsAsset> {
  const response = await fetch('/assets/file-formats.yaml');
  if (!response.ok) {
    throw new Error(`Unable to load file-format descriptions: ${response.status}`);
  }

  return parse(await response.text()) as FileFormatsAsset;
}

const meta: Meta<VersionControl> = {
  component: VersionControl,
  title: 'Design System/Version Control',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=9337-37',
    },
  },
  loaders: [async () => ({ fileFormats: (await loadFileFormats()).fileFormats })],
  args: {
    versions: VERSIONS,
  },
  render: (args, { loaded }) => ({
    props: {
      ...args,
      fileFormats: loaded['fileFormats'] as FileFormatDescription[],
    },
    template: `
      <ang-version-control
        [versions]="versions"
        [fileFormats]="fileFormats"
        [(selectedVersion)]="selectedVersion"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj<VersionControl>;

export const Default: Story = {};

export const NoDownloads: Story = {
  args: {
    versions: [{ version: '3.0.0', downloadOptions: [] }],
  },
};
