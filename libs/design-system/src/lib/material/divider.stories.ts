import { MatDivider, MatDividerModule } from '@angular/material/divider';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

const meta: Meta<MatDivider> = {
  title: 'Material/Divider',
  component: MatDivider,
  args: {
    inset: false,
    vertical: false,
  },
  argTypes: {
    inset: {
      control: 'boolean',
      description: 'Whether the divider is inset from the start edge.',
    },
    vertical: {
      control: 'boolean',
      description: 'Whether the divider is vertically aligned.',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatDividerModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <div
        [style.align-items]="vertical ? 'center' : null"
        [style.display]="vertical ? 'flex' : 'block'"
        [style.height]="vertical ? '3rem' : null"
      >
        <span>Before</span>
        <mat-divider
          ${argsToTemplate(args)}
          [style.margin]="vertical ? '0 1rem' : '1rem 0'"
          [style.align-self]="vertical ? 'stretch' : null"
        />
        <span>After</span>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<MatDivider>;

export const Horizontal: Story = {};

export const Vertical: Story = {
  args: {
    vertical: true,
  },
};
