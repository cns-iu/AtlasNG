import { type Meta, type StoryObj } from '@storybook/angular';
import { NotFoundPage } from './not-found-page';

const meta: Meta<NotFoundPage> = {
  component: NotFoundPage,
  title: 'Design System / Error Pages / Not Found Page',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=3287-71',
    },
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<NotFoundPage>;

export const Default: Story = {};
