import { Meta, StoryObj } from '@storybook/angular';
import { EndOfResults } from './end-of-results';

const meta: Meta<EndOfResults> = {
  component: EndOfResults,
  title: 'Design System/Indicators/End of Results',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=5406-27037',
    },
  },
  args: {
    count: 2,
  },
};

export default meta;
type Story = StoryObj<EndOfResults>;

export const Default: Story = {
  args: {
    count: 2,
  },
};

export const WithCustomLabels: Story = {
  args: {
    count: 25,
    label: 'Total Found:',
    description: 'No more items to display',
  },
};

export const WithLargeCount: Story = {
  args: {
    count: 10044102,
  },
};
