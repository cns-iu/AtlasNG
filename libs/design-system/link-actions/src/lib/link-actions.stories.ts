import { Meta, StoryObj } from '@storybook/angular';
import { LinkActions } from './link-actions';

const meta: Meta = {
  title: 'Design System/Link Actions',
  component: LinkActions,
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
