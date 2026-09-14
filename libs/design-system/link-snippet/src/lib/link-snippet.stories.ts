import { Meta, StoryObj } from '@storybook/angular';
import { LinkSnippet } from './link-snippet';

const meta: Meta = {
  title: 'Design System/Link Snippet',
  component: LinkSnippet,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/gQEMLugLjweDvbsNNUVffD/AtlasNG-Design-System-Repository?node-id=12516-45367&t=XVMXP9ZuRCiOohEG-4',
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};
