import { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { NoResults } from './no-results';

const meta: Meta<NoResults> = {
  component: NoResults,
  title: 'Design System/Indicators/No Results',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=4958-37',
    },
  },
  args: {
    clearClick: fn(),
  },
};

export default meta;
type Story = StoryObj<NoResults>;

export const Default: Story = {};

export const WithCustomLabels: Story = {
  args: {
    description: 'Custom no results message',
    label: 'Custom label',
  },
};
