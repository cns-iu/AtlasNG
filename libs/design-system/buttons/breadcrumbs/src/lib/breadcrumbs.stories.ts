import { Meta, StoryObj } from '@storybook/angular';
import { Breadcrumbs } from './breadcrumbs';

const meta: Meta<Breadcrumbs> = {
  component: Breadcrumbs,
  title: 'Design System/Buttons/Breadcrumbs',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=892-4',
    },
  },
  args: {
    crumbs: [{ name: 'Home', route: '/' }, { name: 'Label', route: '/products' }, { name: 'Label' }],
  },
  argTypes: {},
};

export default meta;
type Story = StoryObj<Breadcrumbs>;

export const Default: Story = {};
