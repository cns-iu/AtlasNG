import { ContentOutlet, provideContentTemplates, withDefinitions } from '@atlasng/content-templates';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { DESIGN_SYSTEM_DEFINITIONS } from './definitions';

const meta: Meta<ContentOutlet> = {
  component: ContentOutlet,
  title: 'Content Templates/Design System Definitions',
  decorators: [
    applicationConfig({ providers: [provideContentTemplates({}, withDefinitions(DESIGN_SYSTEM_DEFINITIONS))] }),
  ],
  render: (args) => ({
    props: args,
    template: '<ang-content-outlet [document]="document" />',
  }),
};

export default meta;

type Story = StoryObj<ContentOutlet>;

/** A page built only from the design-system definitions: header, section, heading, paragraph, link, notice, snippet. */
export const Page: Story = {
  args: {
    document: {
      version: 1,
      content: [
        { component: 'ContentHeader', config: { tagline: 'Content templates', level: 1, id: 'top' } },
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
          config: { title: 'Getting started', level: 2, id: 'getting-started' },
          content: [
            { component: 'Heading', config: { level: 3 }, content: 'Install' },
            { component: 'ContentParagraph', content: 'Add the library and register the definitions.' },
            { component: 'LinkSnippet', config: { url: 'https://www.npmjs.com/package/@atlasng/content-templates' } },
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
