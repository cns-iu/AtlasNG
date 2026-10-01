import { ContentParagraph } from '@atlasng/design-system/content/content-paragraph';
import { ContentSection } from '@atlasng/design-system/content/content-section';
import { argsToTemplate, type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { Notice, type NoticeVariant } from './notice';

/** Story args: the notice inputs plus the text projected into its body. */
type NoticeArgs = Notice & { content: string };

/** Every supported notice variant, in display order. */
const VARIANTS: NoticeVariant[] = ['info', 'success', 'warning', 'critical', 'unavailable'];

const meta: Meta<NoticeArgs> = {
  component: Notice,
  title: 'Design System/Indicators/Notice',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/gQEMLugLjweDvbsNNUVffD/AtlasNG-Design-System-Repository?node-id=18310-76729',
    },
  },
  args: {
    variant: 'info',
    heading: 'Notice',
    content:
      'Notices highlight information that affects the surrounding content, such as a recent update, a known ' +
      'limitation, or a step to complete before continuing.',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: VARIANTS,
      description: 'Tone of the notice, which sets its colors, icon, and screen-reader label.',
    },
    heading: {
      control: 'text',
      description: 'Optional title shown above the body.',
    },
    variantLabel: {
      control: 'text',
      description: 'Screen-reader text read before the content. Defaults to a label for the variant.',
    },
    content: {
      control: 'text',
      description: 'The text projected into the notice body.',
    },
  },
  render: ({ content, ...args }) => ({
    props: { ...args, content },
    template: `<ang-notice ${argsToTemplate(args)}>{{ content }}</ang-notice>`,
  }),
};

export default meta;
type Story = StoryObj<NoticeArgs>;

export const Default: Story = {};

/** All supported variants displayed together. */
export const Variants: Story = {
  args: {
    heading: 'Title',
    content: 'Lorem ipsum dolor sit amet consectetur adipiscing elit.',
  },
  render: (args) => ({
    props: { ...args, variants: VARIANTS },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 462px;">
        @for (variant of variants; track variant) {
          <ang-notice [variant]="variant" [heading]="heading">{{ content }}</ang-notice>
        }
      </div>
    `,
  }),
};

/** A notice placed between paragraphs of a content section, as on a documentation page. */
export const InContentSection: Story = {
  decorators: [moduleMetadata({ imports: [ContentSection, ContentParagraph] })],
  args: {
    variant: 'info',
    heading: 'Before you begin',
    content:
      'Each component is published as its own entry point, such as @atlasng/design-system/indicators/notice. ' +
      'Import only the components a page uses to keep application bundles small.',
  },
  render: ({ content, ...args }) => ({
    props: { ...args, content },
    template: `
      <ang-content-section [title]="'Install the design system'" [level]="2" id="install">
        <ang-content-paragraph>
          Add the AtlasNG design system to an Angular application to use its themed components, design tokens,
          and layout utilities.
        </ang-content-paragraph>
        <ang-notice ${argsToTemplate(args)}>{{ content }}</ang-notice>
        <ang-content-paragraph>
          After installing the package, add a component to the imports of the standalone component that uses it,
          then place its selector in that component's template.
        </ang-content-paragraph>
      </ang-content-section>
    `,
  }),
};
