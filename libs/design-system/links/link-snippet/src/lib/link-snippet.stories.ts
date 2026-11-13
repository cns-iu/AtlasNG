import { componentWrapperDecorator, Meta, StoryObj } from '@storybook/angular';
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

/** A URL wider than its container scrolls horizontally, with its edges fading while there is more to scroll to. */
export const LongUrl: Story = {
  args: {
    url: 'https://cdn.humanatlas.io/digital-objects/ref-organ/kidney-female-left/v1.3/assets/3d-vh-f-kidney-l.glb',
  },
  decorators: [componentWrapperDecorator((story) => `<div style="max-width: 400px">${story}</div>`)],
};
