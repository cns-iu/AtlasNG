import { MatCheckbox } from '@angular/material/checkbox';
import { argsToTemplate, Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';

interface CustomizationControls {
  label?: string;
}

const meta: Meta<MatCheckbox & CustomizationControls> = {
  title: 'Material/Checkbox',
  component: MatCheckbox,
  args: {
    checked: false,
    disabled: false,
    indeterminate: false,
    labelPosition: 'after',
    label: undefined,
    change: fn(),
    indeterminateChange: fn(),
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked.',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled.',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Whether the checkbox is in an indeterminate state.',
    },
    labelPosition: {
      control: 'select',
      description: 'Position of the label relative to the checkbox.',
      options: ['before', 'after'],
    },
    label: {
      control: 'text',
      description: 'The label displayed next to the checkbox.',
    },
    change: {
      action: 'changed',
      description: 'Event emitted when the checked state changes.',
    },
    indeterminateChange: {
      action: 'indeterminate changed',
      description: 'Event emitted when the indeterminate state changes.',
    },
  },
  render: (args) => ({
    props: args,
    template: `<mat-checkbox ${argsToTemplate(args, { exclude: ['label'] })} aria-label="Sample Checkbox">
      ${args.label ?? ''}
    </mat-checkbox>`,
  }),
};

export default meta;
type Story = StoryObj<MatCheckbox & CustomizationControls>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: {
    label: 'Sample Checkbox',
  },
};
