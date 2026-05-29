import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

const meta: Meta = {
  title: 'Material/Plain Tooltip',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=1011-9744',
    },
  },
  args: {
    text: 'Tooltip text',
  },
  decorators: [
    moduleMetadata({
      imports: [MatButtonModule, MatTooltipModule],
    }),
  ],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <button mat-flat-button matTooltip="${args['text']}">
        Hover me
      </button>
    `,
  }),
};
