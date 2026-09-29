import { type Meta, type StoryObj } from '@storybook/angular';
import { ContentParagraph } from './content-paragraph';

type ContentParagraphArgs = ContentParagraph & { content: string };

const meta: Meta<ContentParagraphArgs> = {
  component: ContentParagraph,
  title: 'Design System/Content/Content Paragraph',
  args: {
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. ' +
      'Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit.',
  },
  argTypes: {
    content: {
      control: 'text',
      description: 'The text projected into the paragraph.',
    },
  },
  render: (args) => ({
    props: args,
    template: `<ang-content-paragraph>{{ content }}</ang-content-paragraph>`,
  }),
};

export default meta;
type Story = StoryObj<ContentParagraphArgs>;

export const Default: Story = {};
