import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { SkipLink } from './skip-link';
import { SkipLinkTarget } from './skip-link-target';

const meta: Meta<SkipLink> = {
  component: SkipLink,
  title: 'Design System/Links/Skip Link',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=6668-345',
    },
  },
  decorators: [moduleMetadata({ imports: [SkipLinkTarget] })],
  args: {
    label: 'Skip to main content',
  },
  argTypes: {
    anchorId: {
      control: 'text',
      description: 'Id of the element to skip to. Takes precedence over the page’s `angSkipLinkTarget`.',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <ang-skip-link ${argsToTemplate(args)} />
      <main angSkipLinkTarget>
        <h1>Main content</h1>
        <p>Press Enter on the skip link to move focus here.</p>
      </main>
    `,
  }),
};

export default meta;
type Story = StoryObj<SkipLink>;

export const Default: Story = {
  play: async ({ userEvent }) => {
    await userEvent.tab();
  },
};

export const MovesFocusToTarget: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('main')).toHaveFocus();
  },
};

/** An explicit `anchorId` links to that element instead of the `angSkipLinkTarget`. */
export const WithAnchorId: Story = {
  args: {
    anchorId: 'page-content',
  },
  render: (args) => ({
    props: args,
    template: `
      <ang-skip-link ${argsToTemplate(args)} />
      <main>
        <h1>Main content</h1>
        <section id="page-content" aria-labelledby="page-content-heading">
          <h2 id="page-content-heading">Page content</h2>
          <p>Press Enter on the skip link to move focus here.</p>
        </section>
      </main>
    `,
  }),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('region', { name: 'Page content' })).toHaveFocus();
  },
};
