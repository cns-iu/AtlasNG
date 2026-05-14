import { Meta, StoryObj } from '@storybook/angular';
import { NoResults } from './no-results';

const meta: Meta = {
  component: NoResults,
  title: 'Design System/Indicators/No Results',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=4958-37',
    },
  },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {};
