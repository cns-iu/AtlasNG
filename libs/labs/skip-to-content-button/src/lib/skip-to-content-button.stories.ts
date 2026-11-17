import { argsToTemplate, Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { SkipToContentButton } from './skip-to-content-button';

const meta: Meta<SkipToContentButton> = {
  component: SkipToContentButton,
  title: 'Labs/Skip to Content Button',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=6668-345',
    },
  },
  args: {
    anchorId: 'main-content',
    label: 'Skip to main content',
  },
  argTypes: {
    anchorId: {
      control: 'text',
      description: 'The anchor ID for the skip link (e.g. the ID of the main content element)',
    },
  },
};

export default meta;
type Story = StoryObj<SkipToContentButton>;

export const Default: Story = {
  play: async ({ userEvent }) => {
    await userEvent.tab();
  },
};

export const MovesFocusToTarget: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-skip-to-content-button ${argsToTemplate(args)} />
      <main id="main-content">
        <h1>Main content</h1>
        <p>Press Enter on the skip link to move focus here.</p>
      </main>
    `,
  }),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('main')).toHaveFocus();
  },
};
