import { type Meta, type StoryObj } from '@storybook/angular';
import { Results } from './results';

const meta: Meta<Results> = {
  component: Results,
  title: 'Design System/Indicators/Results',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/HRA-Components?node-id=2100-10720&t=DmEBvTGkDSWCMOf1-4',
    },
  },

  args: {
    value: 100000,
    total: 100000,
    description: 'Viewing',
  },
};
export default meta;
type Story = StoryObj<Results>;

export const Default: Story = {};

export const DifferentCounts: Story = {
  args: {
    value: 50000,
    total: 100000,
    description: 'Viewing',
  },
};
