import { MatSlideToggle, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

interface CustomizationControls {
  label?: string;
}

const meta: Meta<MatSlideToggle & CustomizationControls> = {
  title: 'Material/Slide Toggle',
  component: MatSlideToggle,
  args: {
    checked: false,
    disabled: false,
    hideIcon: false,
    label: 'Slide toggle',
    labelPosition: 'after',
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the slide toggle is checked.',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the slide toggle is disabled.',
    },
    hideIcon: {
      control: 'boolean',
      description: 'Whether the icon inside the slide toggle is hidden.',
    },
    label: {
      control: 'text',
      description: 'The label displayed next to the slide toggle.',
    },
    labelPosition: {
      control: 'select',
      description: 'Position of the label relative to the slide toggle.',
      options: ['before', 'after'],
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatSlideToggleModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `<mat-slide-toggle ${argsToTemplate(args, { exclude: ['label'] })}>
      {{ label }}
    </mat-slide-toggle>`,
  }),
};

export default meta;
type Story = StoryObj<MatSlideToggle & CustomizationControls>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const WithoutIcon: Story = {
  args: {
    hideIcon: true,
  },
};

export const LabelBefore: Story = {
  args: {
    labelPosition: 'before',
  },
};
