import { Meta, StoryObj } from '@storybook/angular';
import { LinkSnippet } from './link-snippet';

const meta: Meta = {
  title: 'Design System/Links/Link Snippet',
  component: LinkSnippet,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=4453-105',
    },
  },
  args: {
    url: 'https://purl.humanatlas.io/2d-ftu/skin-hair-follicle',
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};
