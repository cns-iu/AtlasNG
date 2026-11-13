import { type Meta, type StoryObj } from '@storybook/angular';
import { Eyebrow } from './eyebrow';

type EyebrowArgs = Eyebrow & { content: string };

const meta: Meta<EyebrowArgs> = {
  component: Eyebrow,
  title: 'Design System/Content/Eyebrow',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=11090-19928',
    },
    docs: {
      description: {
        component: `
A short uppercase label above a heading that names its category or context.

### Writing eyebrows

- Use 1 to 3 words. The shorter the better, so readers can scan it at a glance.
- Name the category, step, or option, such as "Option 1", "Case study", or "Step 2". Don't repeat the heading.
- Write in sentence case, not all caps. The component uppercases the text, and screen readers may spell out text typed in capitals letter by letter.
- Leave off ending punctuation.
- Keep sibling eyebrows parallel, such as "Option 1" and "Option 2".

### Accessibility

The eyebrow adds no semantics of its own. Use \`<ang-eyebrow>\`, or add \`angEyebrow\` to the element that fits its job:

- **Extra context**, such as a category: place it before the heading. Readers who jump between headings skip it, so don't put anything essential in it.
- **Context the heading needs**, such as "Option 1": put it inside the heading so it becomes part of the heading's name, as in \`<h3><span angEyebrow>Option 1</span> Heading</h3>\`.
- **A card or stat title**, such as "Processes": make it the heading, as in \`<h3 angEyebrow>Processes</h3>\`. Keep heading levels in order.

Eyebrow text is small, so it needs a contrast ratio of at least 4.5:1. The default \`primary\` color meets it on every surface in every brand except Human Reference Atlas (HRA) light, where it drops below 4.5:1 on \`surface-container\` and darker surfaces. HRA apps use \`on-primary-container\` instead:

\`\`\`scss
@include ds.eyebrow-overrides((color: ds.sys-slot(on-primary-container)));
\`\`\`

Check any other color override against every surface it sits on.
        `,
      },
    },
  },
  args: {
    content: 'Option 1',
  },
  argTypes: {
    content: {
      control: 'text',
      description: 'The eyebrow text, 1 to 3 words in sentence case. CSS uppercases it.',
    },
  },
  render: (args) => ({
    props: args,
    template: `<ang-eyebrow>{{ content }}</ang-eyebrow>`,
  }),
};

export default meta;
type Story = StoryObj<EyebrowArgs>;

export const Default: Story = {};

/**
 * Place the eyebrow directly above the heading it introduces when it adds extra context.
 * Readers who jump between headings skip it.
 */
export const AboveHeading: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-eyebrow>{{ content }}</ang-eyebrow>
      <h3 style="margin: 0; font: var(--mat-sys-title-large); color: var(--mat-sys-on-surface);">
        Section heading
      </h3>
    `,
  }),
};

/** Put the eyebrow inside the heading when the heading needs it, so it becomes part of the heading's name. */
export const InsideHeading: Story = {
  render: (args) => ({
    props: args,
    template: `
      <h3 style="margin: 0; font: var(--mat-sys-title-large); color: var(--mat-sys-on-surface);">
        <span angEyebrow>{{ content }}</span> Section heading
      </h3>
    `,
  }),
};

/** Make the eyebrow the heading when it titles a card or stat. */
export const AsHeading: Story = {
  args: { content: 'Processes' },
  render: (args) => ({
    props: args,
    template: `
      <h3 angEyebrow>{{ content }}</h3>
      <p style="margin: 0; font: var(--mat-sys-display-small); color: var(--mat-sys-on-surface);">809</p>
    `,
  }),
};

/**
 * Change the color with the `color` token, for example
 * `@include ds.eyebrow-overrides((color: ds.sys-slot(on-primary-container)))`.
 */
export const CustomColor: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-eyebrow style="--ang-eyebrow-color: var(--mat-sys-on-primary-container);">{{ content }}</ang-eyebrow>
    `,
  }),
};
