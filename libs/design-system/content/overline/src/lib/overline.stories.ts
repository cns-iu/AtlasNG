import { type Meta, type StoryObj } from '@storybook/angular';
import { Overline } from './overline';

type OverlineArgs = Overline & { content: string };

const meta: Meta<OverlineArgs> = {
  component: Overline,
  title: 'Design System/Content/Overline',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=11090-19928',
    },
    docs: {
      description: {
        component: `
A short uppercase label above a heading that names its category or context.

### Writing overlines

- Use 1 to 3 words. The shorter the better, so readers can scan it at a glance.
- Name the category, step, or option, such as "Option 1", "Case study", or "Step 2". Don't repeat the heading.
- Write in sentence case, not all caps. The component uppercases the text, and screen readers may spell out text typed in capitals letter by letter.
- Leave off ending punctuation.
- Keep sibling overlines parallel, such as "Option 1" and "Option 2".
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
      description: 'The overline text, 1 to 3 words in sentence case. CSS uppercases it.',
    },
  },
  render: (args) => ({
    props: args,
    template: `<ang-overline>{{ content }}</ang-overline>`,
  }),
};

export default meta;
type Story = StoryObj<OverlineArgs>;

export const Default: Story = {};

/**
 * Place the overline directly above the heading it introduces when it adds extra context.
 * Readers who jump between headings skip it, so don't put anything essential in it.
 */
export const AboveHeading: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-overline>{{ content }}</ang-overline>
      <h3 style="margin: 0; font: var(--mat-sys-title-large); color: var(--mat-sys-on-surface);">
        Section heading
      </h3>
    `,
  }),
};

/** Put the overline inside the heading when the heading needs it, so it becomes part of the heading's name. */
export const InsideHeading: Story = {
  render: (args) => ({
    props: args,
    template: `
      <h3 style="margin: 0; font: var(--mat-sys-title-large); color: var(--mat-sys-on-surface);">
        <span angOverline>{{ content }}</span> Section heading
      </h3>
    `,
  }),
};

/** Make the overline the heading when it titles a card or stat. Keep heading levels in order. */
export const AsHeading: Story = {
  args: { content: 'Processes' },
  render: (args) => ({
    props: args,
    template: `
      <h3 angOverline>{{ content }}</h3>
      <p style="margin: 0; font: var(--mat-sys-display-small); color: var(--mat-sys-on-surface);">809</p>
    `,
  }),
};

/**
 * Change the color with the `color` token, for example
 * `@include ds.overline-overrides((color: ds.sys-slot(on-primary-container)))`, which Human Reference Atlas (HRA) apps
 * use for contrast. Check the new color for a contrast ratio of at least 4.5:1 on every surface it sits on.
 */
export const CustomColor: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-overline style="--ang-overline-color: var(--mat-sys-on-primary-container);">{{ content }}</ang-overline>
    `,
  }),
};
