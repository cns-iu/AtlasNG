import { type Meta, type StoryObj } from '@storybook/angular';
import { ContentHeader } from './content-header';

const meta: Meta<ContentHeader> = {
  component: ContentHeader,
  title: 'Design System/Content/Content Header',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=2355-1046',
    },
  },
  args: {
    level: 1,
    id: 'anchor',
    tagline: 'Content heading',
    underlined: true,
  },
  argTypes: {
    level: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6],
      description: 'The heading level (1-6) to determine the appropriate HTML tag.',
    },
    id: {
      control: 'text',
      description: 'The heading ID. A non-empty value also links the tagline to the heading.',
    },
    tagline: {
      control: 'text',
      description: 'The text displayed in the heading.',
    },
    underlined: {
      control: 'boolean',
      description: 'Whether to display a divider below the heading.',
    },
  },
};

export default meta;
type Story = StoryObj<ContentHeader>;

export const Default: Story = {};

export const EmptyId: Story = {
  args: {
    id: '',
  },
};

export const LongText: Story = {
  args: {
    tagline: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris.',
  },
};
