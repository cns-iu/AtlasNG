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
    items: [{ name: 'Home', command: '/' }, { name: 'Products', command: '/products' }, { name: 'Current Page' }],
    separator: '/',
  },
};

export default meta;
type Story = StoryObj<Breadcrumbs>;

export const Default: Story = {};
