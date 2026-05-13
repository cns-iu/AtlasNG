import { Meta, StoryObj } from '@storybook/angular';
import { SocialMediaButton } from './social-media-button';
import { SOCIAL_IDS } from './static-data/parsed';
import { SocialMedia } from './types/social-media.schema';

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
type Story = StoryObj<SocialMedia>;

export const Default: Story = {};
