import { applicationConfig, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const meta: Meta = {
  title: 'Design System/Buttons/Icon Button',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=24-876',
    },
  },
  args: {
    icon: 'search',
  },
  argTypes: {
    icon: {
      type: 'string',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatIconModule, MatButtonModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <button mat-icon-button>
        <mat-icon>${args['icon']}</mat-icon>
      </button>
    `,
  }),
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {},
};
