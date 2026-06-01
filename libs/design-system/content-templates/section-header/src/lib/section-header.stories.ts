import { Meta, StoryObj } from '@storybook/angular';
import { SectionHeader } from './section-header';

interface ExtraArgs {
  level: number;
  content: string;
}

function clampLevel(level: number): number {
  level = Math.max(level, 1);
  level = Math.min(level, 6);
  return level;
}

const meta: Meta<SectionHeader & ExtraArgs> = {
  component: SectionHeader,
  title: 'Design System/Content Templates/Section Header',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=2355-1046',
    },
  },
  args: {
    level: 1,
    anchor: 'anchor',
    content: 'Content Text',
  },
  argTypes: {
    level: {
      control: { type: 'number', min: 1, max: 6 },
      description: 'The heading level (1-6) to determine the appropriate HTML tag.',
    },
    content: {
      control: 'text',
      description: 'The text content of the section header.',
    },
    underlined: {
      control: 'boolean',
      description: 'Whether to display the underline.',
    },
  },
  render: (args) => ({
    props: args,
    styles: ['[ang-section-header] { margin: 0 2rem; }'],
    template: `<h${clampLevel(args.level)} ang-section-header anchor="${args.anchor}" underlined="${args.underlined}">
        Heading ${clampLevel(args.level)} ${args.content}
      </h${clampLevel(args.level)}>`,
  }),
};

export default meta;
type Story = StoryObj<SectionHeader & ExtraArgs>;

export const Default: Story = {};

export const LongText: Story = {
  args: {
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris.',
  },
};
