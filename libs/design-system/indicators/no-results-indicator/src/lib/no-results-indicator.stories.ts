import { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { NoResultsIndicator } from './no-results-indicator';

const meta: Meta<NoResultsIndicator> = {
  component: NoResultsIndicator,
  title: 'Design System/Indicators/No Results Indicator',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=4958-37',
    },
  },
  args: {
    clear: fn(),
  },
};

export default meta;
type Story = StoryObj<NoResultsIndicator>;

export const Default: Story = {};

export const WithCustomLabels: Story = {
  args: {
    description: 'Custom no results message',
    label: 'Custom label',
  },
};
