import { ContentBlock, provideContentBlocks, withDefinitions } from '@atlasng/content-blocks';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { DESIGN_SYSTEM_DEFINITIONS } from './definitions';

const meta: Meta<ContentBlock> = {
  component: ContentBlock,
  title: 'Content Blocks/Design System Definitions',
  decorators: [
    applicationConfig({ providers: [provideContentBlocks({}, withDefinitions(DESIGN_SYSTEM_DEFINITIONS))] }),
  ],
  render: (args) => ({
    props: args,
    template: '<ang-content-block [document]="document" />',
  }),
};

export default meta;

type Story = StoryObj<ContentBlock>;

/** A page built from the text design-system definitions: header, section, heading, paragraph, link, notice, snippet. */
export const Page: Story = {
  args: {
    document: {
      version: 1,
      content: [
        { component: 'ContentHeader', config: { tagline: 'Content blocks', level: 1, id: 'top' } },
        {
          component: 'ContentParagraph',
          content: [
            'Pages like this one are rendered from a JSON document. Each node names a ',
            { component: 'TextLink', config: { href: 'https://github.com/cns-iu/AtlasNG' }, content: 'definition' },
            ' that maps it to a design-system component.',
          ],
        },
        {
          component: 'ContentSection',
          config: { tagline: 'Getting started', level: 2, id: 'getting-started' },
          content: [
            { component: 'Heading', config: { level: 3 }, content: 'Install' },
            { component: 'ContentParagraph', content: 'Add the library and register the definitions.' },
            { component: 'LinkSnippet', config: { url: 'https://www.npmjs.com/package/@atlasng/content-blocks' } },
            {
              component: 'Notice',
              config: { variant: 'warning', tagline: 'Work in progress' },
              content: 'The document format may still change.',
            },
          ],
        },
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('heading', { name: 'Getting started' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'definition' })).toHaveAttribute(
      'href',
      'https://github.com/cns-iu/AtlasNG',
    );
  },
};

/** Profile cards whose links and actions are JSON: a route command with a fragment, and a projected `TextLink`. */
export const Cards: Story = {
  args: {
    document: {
      version: 1,
      content: [
        {
          component: 'BasicProfileCard',
          config: {
            image: 'https://github.com/cns-iu.png',
            name: 'CNS',
            description: ['Cyberinfrastructure for Network Science Center', 'Indiana University'],
            link: { command: 'https://github.com/cns-iu', fragment: 'repositories' },
          },
        },
        {
          component: 'BrandProfileCard',
          styles: { maxWidth: '20rem' },
          config: {
            image: 'https://github.com/cns-iu.png',
            name: 'AtlasNG',
            description: 'Angular libraries for atlas applications.',
            centered: true,
          },
          content: {
            actions: {
              component: 'TextLink',
              config: { href: 'https://github.com/cns-iu/AtlasNG' },
              content: 'GitHub',
            },
          },
        },
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('link', { name: 'CNS' })).toHaveAttribute(
      'href',
      'https://github.com/cns-iu#repositories',
    );
    await expect(canvas.getByRole('link', { name: 'GitHub' })).toBeVisible();
  },
};

/** A table whose columns are described in config and whose rows are inline data. */
export const Table: Story = {
  args: {
    document: {
      version: 1,
      content: {
        component: 'Table',
        styles: { maxHeight: '320px' },
        config: {
          columns: [
            { prop: 'name', name: 'Name', minWidth: 160 },
            { prop: 'score', name: 'Score', type: 'number' },
            { prop: 'id', name: 'ID', type: 'code', sortable: false },
            { prop: 'tags', name: 'Tags', type: 'chip', sortable: false, minWidth: 220 },
            { prop: 'profile', name: 'Profile', type: 'link', label: 'View profile', sortable: false },
          ],
        },
        data: {
          rows: [
            { name: 'Ada Lovelace', score: 1234.5, id: 'ada', tags: ['Algorithms'], profile: '/people/ada' },
            { name: 'Grace Hopper', score: 942, id: 'grace', tags: ['COBOL', 'Compilers'], profile: '/people/grace' },
            { name: 'Katherine Johnson', score: 98, id: 'katherine', tags: ['NASA'], profile: '/people/katherine' },
          ],
        },
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('Grace Hopper')).toBeVisible();
    await expect(canvas.getByText('1,234.5')).toBeVisible();
  },
};

/** A YouTube video, shown as a placeholder linking to YouTube until marketing cookies are enabled. */
export const YouTubePlayer: Story = {
  args: {
    document: {
      version: 1,
      content: {
        component: 'YouTubePlayer',
        config: {
          videoId: 'pzUFmDhQEO8',
          width: 480,
          height: 270,
          playerVars: { cc_load_policy: 1, rel: 0 },
          placeholderButtonLabel: 'Play video',
        },
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('link', { name: 'Play video' })).toBeVisible();
  },
};
