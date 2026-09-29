import { type Meta, type StoryObj } from '@storybook/angular';
import { Heading } from './heading';

const meta: Meta<Heading> = {
  component: Heading,
  title: 'Design System/Content/Heading',
  args: {
    level: 1,
    id: 'page-heading',
    tagline: 'Page heading',
  },
  argTypes: {
    level: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6],
    },
  },
};

export default meta;
type Story = StoryObj<Heading>;

export const Default: Story = {};
