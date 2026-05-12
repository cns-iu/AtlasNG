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
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/Design-System-Components?node-id=333-4',
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
