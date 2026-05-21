import { type Meta, type StoryObj } from '@storybook/angular';
import { ResultsIndicator } from './results';

const meta: Meta<ResultsIndicator> = {
  component: ResultsIndicator,
  title: 'Design System/Indicators/Results',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=2100-10716',
    },
  },
  args: {
    value: 100000,
    total: 100000,
  },
};

export default meta;
type Story = StoryObj<ResultsIndicator>;

export const Default: Story = {};

export const WithPrefixAndSuffix: Story = {
  args: {
    value: 50000,
    total: 100000,
    prefix: 'Viewing',
    suffix: 'items',
  },
};
