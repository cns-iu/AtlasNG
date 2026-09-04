import { argsToTemplate, Meta, StoryObj } from '@storybook/angular';
import { SectionHeader } from './section-header';

interface ExtraArgs {
  level: number;
  content: string;
}

const meta: Meta<SectionHeader & ExtraArgs> = {
  component: SectionHeader,
  title: 'Design System/Section Header',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=2355-1046',
    },
  },
  args: {
    level: 1,
    id: 'anchor',
    content: 'Content Text',
    underlined: true,
  },
  argTypes: {
    level: {
      control: { type: 'number', min: 1, max: 6 },
      description: 'The heading level (1-6) to determine the appropriate HTML tag.',
    },
    id: {
      control: 'text',
      description: 'The anchor ID for the section header link.',
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
    styles: ['[angSectionHeader] { margin: 0 2rem; }'],
    template: `<h${args.level} angSectionHeader ${argsToTemplate(args, { exclude: ['content', 'level'] })}>
        Heading ${args.level} ${args.content}
      </h${args.level}>`,
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
