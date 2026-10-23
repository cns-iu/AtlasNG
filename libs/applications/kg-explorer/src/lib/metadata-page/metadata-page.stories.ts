import {
  CSV_FILE_FORMAT,
  JSON_FILE_FORMAT,
  JSON_LD_FILE_FORMAT,
  N_QUADS_FILE_FORMAT,
  N_TRIPLES_FILE_FORMAT,
  RDF_XML_FILE_FORMAT,
  TURTLE_FILE_FORMAT,
  VersionControlFileFormat,
  VersionControlItem,
} from '@atlasng/design-system/version-control';
import { argsToTemplate, Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { MetadataPage, MetadataSection } from './metadata-page';

const DESCRIPTION =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore ' +
  'magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo ' +
  'consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla ' +
  'pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est ' +
  'laborum.';

const SECTIONS: MetadataSection[] = [
  {
    title: 'Description',
    blocks: [
      { type: 'text', content: DESCRIPTION },
      {
        type: 'image',
        src: 'assets/illustration-placeholder.svg',
        alt: 'Placeholder illustration of the cardiovascular system',
      },
    ],
  },
  {
    title: 'Creator(s)',
    blocks: [
      { type: 'text', content: [{ text: 'Jacob C. Scherba', link: 'https://www.example.com', external: true }] },
    ],
  },
  {
    title: 'Project lead(s)',
    blocks: [{ type: 'text', content: [{ text: 'Katy Börner', link: 'https://www.example.com', external: true }] }],
  },
  {
    title: 'Internal reviewer(s)',
    blocks: [{ type: 'text', content: [{ text: 'Rajan Jain', link: 'https://www.example.com', external: true }] }],
  },
  { title: 'Date published', blocks: [{ type: 'text', content: '2026-08-11' }] },
  { title: 'Date last processed', blocks: [{ type: 'text', content: '2026-08-11' }] },
  { title: 'Publisher', blocks: [{ type: 'text', content: 'Whole Person Physiome' }] },
  { title: 'Funder', blocks: [{ type: 'text', content: 'National Institutes of Health (Award number U24AT013504)' }] },
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
  { title: 'Tags', blocks: [{ type: 'chips', labels: ['WPP table', 'Heart', 'Kidney'] }] },
];

const VERSIONS: VersionControlItem<VersionControlFileFormat>[] = [
  {
    label: 'v0.0',
    formats: [
      CSV_FILE_FORMAT,
      JSON_FILE_FORMAT,
      TURTLE_FILE_FORMAT,
      JSON_LD_FILE_FORMAT,
      RDF_XML_FILE_FORMAT,
      N_TRIPLES_FILE_FORMAT,
      N_QUADS_FILE_FORMAT,
    ],
  },
];

const meta: Meta<MetadataPage> = {
  title: 'Applications/KG Explorer/Metadata Page',
  component: MetadataPage,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/bSpc6bQC5nGwDaWJfx7Cen/CNS-Projects-2026?node-id=3037-219946',
    },
    layout: 'fullscreen',
  },
  argTypes: {
    download: { table: { disable: true } },
  },
  args: {
    title: 'Whole Person Physiome (WPP) table for cardiovascular system',
    breadcrumbs: [
      { name: 'Home', command: '/' },
      { name: 'Knowledge Graph Explorer', command: '/kg-explorer' },
      { name: 'Whole Person Physiome (WPP) table for cardiovascular system' },
    ],
    icons: [
      { src: 'assets/product-icon-placeholder.svg', alt: 'Knowledge graph' },
      { src: 'assets/organ-icon-placeholder.svg', alt: 'Heart' },
    ],
    url: 'https://purl.wholepersonphysiome.org/wpp/cardiovascular-system',
    sections: SECTIONS,
    versions: VERSIONS,
    versionControlTagline: 'Digital object version',
    sectionHeadingLevel: 2,
    showBreadcrumbs: true,
    showIcons: true,
    showUrl: true,
    underlinedSections: true,
  },
  render: (args) => ({
    props: args,
    template: `<ang-metadata-page ${argsToTemplate(args, { exclude: ['download'] })} />`,
  }),
};

export default meta;
type Story = StoryObj<MetadataPage>;

/** Metadata page with sample WPP data. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', {
        level: 1,
        name: 'Whole Person Physiome (WPP) table for cardiovascular system',
      }),
    ).toBeVisible();
    await expect(canvas.getByText('Digital object version')).toBeVisible();
  },
};
