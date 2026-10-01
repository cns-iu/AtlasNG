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
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=9820-38',
    },
  },
  args: {
    variant: 'info',
    tagline: 'Notice',
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
    tagline: {
      control: 'text',
      description: 'Optional title shown above the body.',
    },
    level: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6],
      description:
        'Optional heading level for the tagline. Use one level below the surrounding section so the tagline ' +
        'appears in the document outline.',
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

/**
 * Use info for helpful context about the surrounding content, such as a prerequisite, an upcoming change,
 * or where to find related resources. Info is the default variant.
 */
export const Info: Story = {
  args: {
    variant: 'info',
    tagline: 'Quarterly data releases',
    content:
      'New data is added in each quarterly release. Check the release notes to see what changed since your last visit.',
  },
};

/**
 * Use success to confirm that something is complete or in a good state, such as a finished update or fully
 * validated data. Use it sparingly so it keeps its meaning.
 */
export const Success: Story = {
  args: {
    variant: 'success',
    tagline: 'Data validated',
    content: 'Every record in this table has been reviewed by a subject matter expert.',
  },
};

/**
 * Use warning when readers should proceed with care, such as a known limitation, a deprecated feature, or a
 * change that could affect their work.
 */
export const Warning: Story = {
  args: {
    variant: 'warning',
    tagline: 'Deprecated version',
    content: 'This version of the API no longer receives updates. Move to the current version to keep receiving fixes.',
  },
};

/**
 * Use critical for problems that block readers or put their work at risk, such as a breaking change, removed
 * data, or an outage. Reserve it for urgent issues and tell readers what to do next.
 */
export const Critical: Story = {
  args: {
    variant: 'critical',
    tagline: 'Breaking change',
    content:
      'Exports created before version 3 can no longer be imported. Export your data again with the current version.',
  },
};

/**
 * Use unavailable when content or a feature can't be used right now, such as a section that failed to load,
 * a tool that is temporarily offline, or a resource that requires access the reader doesn't have.
 */
export const Unavailable: Story = {
  args: {
    variant: 'unavailable',
    tagline: 'Temporarily unavailable',
    content: 'This visualization is offline while its data is being updated. Check back later.',
  },
};

/** Omit the tagline when the message is short enough to stand on its own. */
export const WithoutTagline: Story = {
  args: {
    tagline: '',
    content: 'Values are rounded to two decimal places.',
  },
};

/** All variants together for comparison. */
export const Variants: Story = {
  args: {
    tagline: 'Tagline',
    content: 'Lorem ipsum dolor sit amet consectetur adipiscing elit.',
  },
  render: (args) => ({
    props: { ...args, variants: VARIANTS },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        @for (variant of variants; track variant) {
          <ang-notice [variant]="variant" [tagline]="tagline">{{ content }}</ang-notice>
        }
      </div>
    `,
  }),
};

/**
 * A notice placed between paragraphs of a content section, as on a documentation page. Its tagline uses
 * heading level 3, one level below the section's level 2 heading.
 */
export const InContentSection: Story = {
  decorators: [moduleMetadata({ imports: [ContentSection, ContentParagraph] })],
  args: {
    variant: 'info',
    tagline: 'Before you begin',
    level: 3,
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
