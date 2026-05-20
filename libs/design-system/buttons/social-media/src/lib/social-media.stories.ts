import { argsToTemplate, Meta, StoryObj } from '@storybook/angular';
import { DEFAULT_SOCIAL_MEDIA_BUTTON_DEFS, SocialMediaButton } from './social-media';

interface CustomizationControls {
  color?: string;
}

const IDS = DEFAULT_SOCIAL_MEDIA_BUTTON_DEFS.map((def) => def.id);

const meta: Meta<SocialMediaButton & CustomizationControls> = {
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
    color: '#1C1B1E',
  },
  argTypes: {
    id: {
      control: 'select',
      options: IDS,
    },
    color: {
      control: 'color',
      description: 'Custom color for the icon.',
    },
  },
  render: (args) => ({
    props: args,
    template: `<ang-social-media-button ${argsToTemplate(args)} style="--mat-icon-button-icon-color: ${args.color}" />`,
  }),
};

export default meta;
type Story = StoryObj<SocialMediaButton & CustomizationControls>;

export const Default: Story = {};
