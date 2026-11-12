import { argsToTemplate, type Meta, type StoryObj } from '@storybook/angular';
import { Skeleton, type SkeletonShape } from './skeleton';

/** Every supported skeleton shape, in display order. */
const SHAPES: SkeletonShape[] = ['text', 'circle', 'rect'];

const meta: Meta<Skeleton> = {
  component: Skeleton,
  title: 'Design System/Indicators/Skeleton',
  args: {
    shape: 'text',
    lines: 1,
  },
  argTypes: {
    shape: {
      control: 'select',
      options: SHAPES,
      description: 'A line of text, a circle, or a rectangle.',
    },
    lines: {
      control: { type: 'number', min: 1 },
      description: 'Number of text lines to stack. The last line is shorter when there is more than one.',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 20rem; font: var(--mat-sys-body-large);">
        <ang-skeleton ${argsToTemplate(args)} />
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<Skeleton>;

export const Default: Story = {};

/** Stack several text lines in place of a paragraph. Each line takes the line height of the surrounding type. */
export const Paragraph: Story = {
  args: { lines: 4 },
};

/** Use a circle in place of an avatar or icon. Size the host to the content it replaces. */
export const Circle: Story = {
  args: { shape: 'circle' },
  render: (args) => ({
    props: args,
    template: `<ang-skeleton ${argsToTemplate(args)} style="width: 2.5rem; height: 2.5rem;" />`,
  }),
};

/** Use a rectangle in place of an image, chart, or other block of content. */
export const Rect: Story = {
  args: { shape: 'rect' },
  render: (args) => ({
    props: args,
    template: `<ang-skeleton ${argsToTemplate(args)} style="width: 20rem; height: 10rem;" />`,
  }),
};

/**
 * Compose shapes into the layout of the content that is loading, and set `aria-busy` on the region
 * so screen readers wait for the real content.
 */
export const LoadingCard: Story = {
  render: () => ({
    template: `
      <div aria-busy="true" aria-label="Profile" role="region"
        style="display: flex; flex-direction: column; gap: 1rem; max-width: 22rem; padding: 1rem;
          border: 1px solid var(--mat-sys-outline-variant); border-radius: var(--mat-sys-corner-medium);">
        <ang-skeleton shape="rect" style="height: 10rem;" />
        <div style="display: flex; align-items: center; gap: 1rem;">
          <ang-skeleton shape="circle" style="flex: none; width: 2.5rem; height: 2.5rem;" />
          <ang-skeleton style="flex: 1; font: var(--mat-sys-title-medium);" />
        </div>
        <ang-skeleton lines="3" style="font: var(--mat-sys-body-medium);" />
      </div>
    `,
  }),
};
