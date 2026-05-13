import { Meta, StoryObj } from '@storybook/angular';
import { SOCIAL_IDS } from './social-media';
import { SocialMediaButton } from './social-media-button';

const meta: Meta = {
  component: SocialMediaButton,
  title: 'Design System/Buttons/Social Media Button',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/gQEMLugLjweDvbsNNUVffD/AtlasNG-Design-System-Repository?node-id=15648-55608&t=ruQjinr7h5ChF73q-4',
    },
  },
  args: {
    id: SOCIAL_IDS[0],
  },
  argTypes: {
    id: {
      control: 'select',
      options: SOCIAL_IDS,
    },
  },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
