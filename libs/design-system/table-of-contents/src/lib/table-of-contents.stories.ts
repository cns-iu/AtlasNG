import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { TableOfContents, TableOfContentsItem } from './table-of-contents';

const items: TableOfContentsItem[] = [
  { tagline: 'Page Title (Generally hidden)', level: 2, anchor: 'overview' },
  { tagline: 'Data sources', level: 2, anchor: 'data-sources' },
  { tagline: 'Methods', level: 3, anchor: 'methods' },
  { tagline: 'Sample preparation', level: 4, anchor: 'sample-preparation' },
  { tagline: 'Data processing', level: 5, anchor: 'data-processing' },
  { tagline: 'Quality checks', level: 6, anchor: 'quality-checks' },
  { tagline: 'Results', level: 2, anchor: 'results' },
  { tagline: 'Limitations', level: 3, anchor: 'limitations' },
  { tagline: 'References', level: 2, anchor: 'references' },
];

const meta: Meta<TableOfContents> = {
  component: TableOfContents,
  title: 'Design System/Table of Contents',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=2571-207',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [TableOfContents],
    }),
  ],
  args: { items },
};

export default meta;
type Story = StoryObj<TableOfContents>;

export const Default: Story = {};

export const ActiveItem: Story = {
  args: { activeItem: items[2] },
};
