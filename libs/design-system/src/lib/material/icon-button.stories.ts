import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface CustomizationControls {
  fontIcon?: string;
}

const meta: Meta<MatIconButton & CustomizationControls> = {
  title: 'Design System/Buttons/Icon Button',
  component: MatIconButton,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=24-876',
    },
  },
  args: {
    fontIcon: 'more_vert',
  },
  argTypes: {
    fontIcon: {
      type: 'string',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatIconModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <button matIconButton aria-label="Example icon button">
        <mat-icon ${argsToTemplate(args)}></mat-icon>
      </button>
    `,
  }),
};
export default meta;
type Story = StoryObj<MatIconButton & CustomizationControls>;

export const Default: Story = {
  args: {},
};
