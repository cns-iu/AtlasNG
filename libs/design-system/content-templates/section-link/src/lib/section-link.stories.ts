import { Meta, StoryObj } from '@storybook/angular';
import { SectionLink } from './section-link';

interface ExtraArgs {
  level: number;
  content: string;
}

function clampLevel(level: number): number {
  level = Math.max(level, 1);
  level = Math.min(level, 6);
  return level;
}

const meta: Meta<SectionLink & ExtraArgs> = {
  component: SectionLink,
  title: 'Design System/Content Templates/Section Link',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=2355-1046',
    },
  },
  args: {
    level: 1,
    anchor: 'anchor',
    underlined: false,
  },
  render: (args) => ({
    props: args,
    styles: ['[ang-section-link] { margin: 0 2rem; }'],
    template: `<h${clampLevel(args.level)} ang-section-link anchor="${args.anchor}" underlined="${args.underlined}">
        ${args.content}
      </h${clampLevel(args.level)}>`,
  }),
};

export default meta;
type Story = StoryObj<SectionLink & ExtraArgs>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    styles: ['[ang-section-link] { margin: 0 2rem; }'],
    template: `<h${clampLevel(args.level)} ang-section-link anchor="${args.anchor}" underlined="${args.underlined}">
        Heading ${clampLevel(args.level)}
      </h${clampLevel(args.level)}>`,
  }),
};

export const LongText: Story = {
  args: {
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris.',
  },
};

export const Underlined: Story = {
  args: {
    content: 'Underlined Section Link',
    underlined: true,
  },
};
