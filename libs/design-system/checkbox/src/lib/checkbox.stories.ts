import { MatCheckboxModule } from '@angular/material/checkbox';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { CheckboxErrorVariantDirective } from './checkbox-error-variant/checkbox-error-variant-directive';
import { CheckboxDirective } from './checkbox.directive';

const meta: Meta = {
  title: 'Design System/Checkbox',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/gQEMLugLjweDvbsNNUVffD/HRA-Design-System-Repository?node-id=6791-24001&t=KSPA1HRCXrHUsgVn-4',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatCheckboxModule, CheckboxDirective, CheckboxErrorVariantDirective],
    }),
  ],
  args: {
    indeterminate: false,
    disabled: false,
  },
  argTypes: {
    indeterminate: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: (args) => ({
    template: `
      <mat-checkbox [indeterminate]=${args['indeterminate']} [disabled]=${args['disabled']} angCheckbox></mat-checkbox>
    `,
  }),
};

export const ErrorState: Story = {
  render: (args) => ({
    template: `
      <mat-checkbox [indeterminate]=${args['indeterminate']} [disabled]=${args['disabled']} angCheckbox angCheckboxErrorVariant></mat-checkbox>
    `,
  }),
};
