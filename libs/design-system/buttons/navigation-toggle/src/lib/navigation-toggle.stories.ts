import { Meta, StoryObj } from '@storybook/angular';
import { NavigationToggle } from './navigation-toggle';

const meta: Meta<NavigationToggle> = {
  component: NavigationToggle,
  title: 'Design System/Buttons/Navigation Toggle',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=2101-11132',
    },
  },
  render: (args) => ({
    props: args,
    template: `<ang-navigation-toggle>Label</ang-navigation-toggle>`,
  }),
};

export default meta;
type Story = StoryObj<NavigationToggle>;

export const Default: Story = {};
