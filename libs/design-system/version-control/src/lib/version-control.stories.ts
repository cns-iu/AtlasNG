import { Meta, StoryObj } from '@storybook/angular';
import { VersionControl, VersionControlVersion } from './version-control';

const SAMPLE_FILE_URL =
  'https://cdn.humanatlas.io/digital-objects/2d-ftu/kidney-cortical-collecting-duct/v1.5/assets/crosswalk.csv';

/** Example versions whose available formats differ. */
const VERSIONS: readonly VersionControlVersion[] = [
  {
    version: '2.3.0',
    downloadOptions: [
      {
        fileFormat: 'CSV',
        downloadUrl: SAMPLE_FILE_URL,
      },
      {
        fileFormat: 'JSON-LD (graph data)',
        downloadUrl: SAMPLE_FILE_URL,
      },
      {
        fileFormat: 'JSON-LD (raw data)',
        downloadUrl: SAMPLE_FILE_URL,
      },
      {
        fileFormat: 'Parquet',
        downloadUrl: SAMPLE_FILE_URL,
      },
      {
        fileFormat: 'Turtle',
        downloadUrl: SAMPLE_FILE_URL,
      },
    ],
  },
  {
    version: '2.2.0',
    downloadOptions: [
      {
        fileFormat: 'CSV',
        downloadUrl: SAMPLE_FILE_URL,
      },
      {
        fileFormat: 'N-Quads',
        downloadUrl: SAMPLE_FILE_URL,
      },
      {
        fileFormat: 'N-Triples',
        downloadUrl: SAMPLE_FILE_URL,
      },
      {
        fileFormat: 'RDF/XML',
        downloadUrl: SAMPLE_FILE_URL,
      },
    ],
  },
  {
    version: '2.1.0',
    downloadOptions: [
      {
        fileFormat: 'GLB',
        downloadUrl: SAMPLE_FILE_URL,
      },
      {
        fileFormat: 'PNG',
        downloadUrl: SAMPLE_FILE_URL,
      },
      {
        fileFormat: 'SVG',
        downloadUrl: SAMPLE_FILE_URL,
      },
    ],
  },
  {
    version: '2.0.0',
    downloadOptions: [
      {
        fileFormat: 'CSV',
        downloadUrl: SAMPLE_FILE_URL,
      },
      {
        fileFormat: 'JSON-LD (graph data)',
        downloadUrl: SAMPLE_FILE_URL,
      },
      {
        fileFormat: 'PDF',
        downloadUrl: SAMPLE_FILE_URL,
      },
    ],
  },
  {
    version: '1.0.0',
    downloadOptions: [
      {
        fileFormat: 'JSON',
        downloadUrl: SAMPLE_FILE_URL,
      },
      {
        fileFormat: 'TSV',
        downloadUrl: SAMPLE_FILE_URL,
      },
    ],
  },
  {
    version: '0.9.0',
    downloadOptions: [
      {
        fileFormat: 'YAML',
        downloadUrl: SAMPLE_FILE_URL,
      },
    ],
  },
];

const meta: Meta<VersionControl> = {
  component: VersionControl,
  title: 'Design System/Version Control',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=9337-37',
    },
  },
  args: {
    versions: VERSIONS,
  },
  render: (args) => ({
    props: args,
    template: `
      <ang-version-control
        [versions]="versions"
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

export const ScrollableDownloads: Story = {
  args: {
    versions: [
      {
        version: '3.0.0',
        downloadOptions: [
          'AI',
          'CSV',
          'GLB',
          'JPEG',
          'JSON',
          'JSON-LD',
          'N-Quads',
          'N-Triples',
          'Parquet',
          'PDF',
          'PNG',
          'RDF/XML',
          'SVG',
          'TSV',
        ].map((fileFormat) => ({
          fileFormat,
          downloadUrl: SAMPLE_FILE_URL,
        })),
      },
    ],
  },
};
