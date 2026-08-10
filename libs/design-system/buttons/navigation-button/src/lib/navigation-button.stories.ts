import { Meta, StoryObj } from '@storybook/angular';
import { NavigationButton } from './navigation-button';

const meta: Meta<NavigationButton> = {
  component: NavigationButton,
  title: 'Design System/Buttons/Navigation Button',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=7493-48830',
    },
  },
  args: {
    link: 'https://example.com',
  },
  render: (args) => ({
    props: args,
    template: `<ang-navigation-button [link]="link">Label</ang-navigation-button>`,
  }),
};

export default meta;
type Story = StoryObj<NavigationButton>;

export const Default: Story = {};
