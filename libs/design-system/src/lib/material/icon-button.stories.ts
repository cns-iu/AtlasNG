import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface CustomizationControls {
  icon?: string;
}

const meta: Meta<CustomizationControls> = {
  title: 'Material/Icon Button',
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
      imports: [MatButtonModule, MatIconModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <a mat-icon-button aria-label="Example icon button" ${argsToTemplate(args, { include: [] })}>
        <mat-icon>${args.icon}</mat-icon>
      </a>
    `,
  }),
};
export default meta;
type Story = StoryObj<CustomizationControls>;

export const Default: Story = {
  args: {},
};
