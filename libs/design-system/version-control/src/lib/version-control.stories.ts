import { argsToTemplate, Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import {
  CSV_FILE_FORMAT,
  FILE_FORMATS,
  GLB_FILE_FORMAT,
  JSON_FILE_FORMAT,
  JSON_LD_GRAPH_DATA_FILE_FORMAT,
  JSON_LD_RAW_DATA_FILE_FORMAT,
  N_QUADS_FILE_FORMAT,
  N_TRIPLES_FILE_FORMAT,
  PARQUET_FILE_FORMAT,
  PDF_FILE_FORMAT,
  PNG_FILE_FORMAT,
  RDF_XML_FILE_FORMAT,
  SVG_FILE_FORMAT,
  TSV_FILE_FORMAT,
  TURTLE_FILE_FORMAT,
  YAML_FILE_FORMAT,
} from './file-formats';
import { VersionControl, type VersionControlFileFormat, type VersionControlItem } from './version-control';

/** Example versions whose available formats differ. */
const VERSIONS: readonly VersionControlItem<VersionControlFileFormat>[] = [
  {
    label: '2.3.0',
    formats: [
      CSV_FILE_FORMAT,
      JSON_LD_GRAPH_DATA_FILE_FORMAT,
      JSON_LD_RAW_DATA_FILE_FORMAT,
      PARQUET_FILE_FORMAT,
      TURTLE_FILE_FORMAT,
    ],
  },
  {
    label: '2.2.0',
    formats: [CSV_FILE_FORMAT, N_QUADS_FILE_FORMAT, N_TRIPLES_FILE_FORMAT, RDF_XML_FILE_FORMAT],
  },
  {
    label: '2.1.0',
    formats: [GLB_FILE_FORMAT, PNG_FILE_FORMAT, SVG_FILE_FORMAT],
  },
  {
    label: '2.0.0',
    formats: [CSV_FILE_FORMAT, JSON_LD_GRAPH_DATA_FILE_FORMAT, PDF_FILE_FORMAT],
  },
  {
    label: '1.0.0',
    formats: [JSON_FILE_FORMAT, TSV_FILE_FORMAT],
  },
  {
    label: '0.9.0',
    formats: [YAML_FILE_FORMAT],
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
    tagline: 'Digital object version',
    versions: VERSIONS,
    download: fn(),
  },
  render: (args) => ({
    props: args,
    template: `<ang-version-control ${argsToTemplate(args)} />`,
  }),
};

export default meta;
type Story = StoryObj<VersionControl>;

export const Default: Story = {};

export const NoDownloads: Story = {
  args: {
    versions: [{ label: '3.0.0', formats: [] }],
  },
};

export const ScrollableDownloads: Story = {
  args: {
    versions: [
      {
        label: '3.0.0',
        formats: [...FILE_FORMATS],
      },
    ],
  },
};
