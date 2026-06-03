import { Meta, StoryObj } from '@storybook/angular';
import { NavigationCategoryToggle } from './navigation-category-toggle';

const meta: Meta<NavigationCategoryToggle> = {
  component: NavigationCategoryToggle,
  title: 'Design System/Buttons/Navigation Category Toggle',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=2101-11132',
    },
  },
  args: {},
  argTypes: {},
};

export default meta;
type Story = StoryObj<NavigationCategoryToggle>;

export const Default: Story = {};
