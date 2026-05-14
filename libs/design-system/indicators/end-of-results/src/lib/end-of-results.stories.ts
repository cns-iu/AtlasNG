import { Meta, StoryObj } from '@storybook/angular';
import { EndOfResults } from './end-of-results';
const meta: Meta<EndOfResults> = {
  component: EndOfResults,
  title: 'Design System/End of Results',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=5406-27037',
    },
  },
  args: {
    count: 2,
  },
  argTypes: {
    count: {
      control: 'number',
      description: 'Number of filtered results to display',
    },
    label: {
      control: 'text',
      description: 'Custom label for results count',
    },
    description: {
      control: 'text',
      description: 'Custom label for end message',
    },
  },
};

export default meta;
type Story = StoryObj<EndOfResults>;

export const Default: Story = {
  args: {
    count: 2,
  },
};

export const ManyResults: Story = {
  args: {
    count: 150,
  },
};

export const CustomLabels: Story = {
  args: {
    count: 25,
    label: 'Total Found:',
    description: 'No more items to display',
  },
};

export const SingleResult: Story = {
  args: {
    count: 1,
  },
};

export const LargeNumber: Story = {
  args: {
    count: 44102,
  },
};
