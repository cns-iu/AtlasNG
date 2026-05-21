import { argsToTemplate, Meta, StoryObj } from '@storybook/angular';
import { DEFAULT_SOCIAL_MEDIA_BUTTON_DEFS, SocialMediaButton } from './social-media';

const IDS = DEFAULT_SOCIAL_MEDIA_BUTTON_DEFS.map((def) => def.id);

const meta: Meta<SocialMediaButton> = {
  component: SocialMediaButton,
  title: 'Design System/Buttons/Social Media Button',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=2470-413',
    },
  },
  args: {
    id: IDS[0],
  },
  argTypes: {
    id: {
      control: 'select',
      options: IDS,
    },
  },
};

export default meta;
type Story = StoryObj<SocialMediaButton>;

export const Default: Story = {};
