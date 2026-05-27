import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface CustomizationControls {
  icon?: string;
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
    icon: 'more_vert',
  },
  argTypes: {
    icon: {
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
      <button mat-icon-button aria-label="Example icon button" ${argsToTemplate(args, { include: [] })}>
        <mat-icon class="material-symbols-rounded">{{ icon }}</mat-icon>
      </button>
    `,
  }),
};
export default meta;
type Story = StoryObj<MatIconButton & CustomizationControls>;

export const Default: Story = {
  args: {},
};
