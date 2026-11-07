import { type Meta, type StoryObj } from '@storybook/angular';
import { LastModified } from './last-modified';

const meta: Meta<LastModified> = {
  component: LastModified,
  title: 'Design System/Content/Last Modified',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=10679-3017',
    },
  },
  args: {
    date: '2026-06-16',
    label: 'Last updated on',
  },
  argTypes: {
    date: {
      control: 'text',
      description:
        'When the page was last modified, as a `Date`, a timestamp in milliseconds, or an ISO 8601 string. ' +
        'The component is hidden when this is empty or invalid.',
    },
    label: {
      control: 'text',
      description: 'Text placed before the date.',
    },
  },
};

export default meta;
type Story = StoryObj<LastModified>;

export const Default: Story = {};
