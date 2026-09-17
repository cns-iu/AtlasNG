import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

interface CustomizationControls {
  disabled: boolean;
  appearance: MatFormFieldAppearance;
  options: { value: string; label: string }[];
}

const meta: Meta<CustomizationControls> = {
  title: 'Material/Form Field/Select',
  decorators: [
    moduleMetadata({
      imports: [MatFormFieldModule, MatSelectModule, ReactiveFormsModule],
    }),
  ],
  args: {
    disabled: false,
    appearance: 'fill',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
    ],
  },
  argTypes: {
    appearance: {
      control: 'select',
      options: ['fill', 'outline'],
    },
  },
};
export default meta;
type Story = StoryObj<CustomizationControls>;

export const Select: Story = {
  render: (args) => ({
    props: {
      ...args,
    },
    template: `
      <mat-form-field [appearance]="appearance" subscriptSizing="dynamic">
        <mat-label>Sex</mat-label>
        <mat-select [disabled]="disabled">
          @for (option of options; track option.value) {
            <mat-option [value]="option.value">{{option.label}}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    `,
    styles: [`mat-form-field { width: 13.125rem; }`],
  }),
};

export const RequiredSelect: Story = {
  render: (args) => ({
    props: {
      ...args,
      selectFormControl: new FormControl({ value: '', disabled: args.disabled }, [Validators.required]),
    },
    template: `
      <mat-form-field [appearance]="appearance" subscriptSizing="dynamic">
        <mat-label>Sex</mat-label>
        <mat-select [formControl]="selectFormControl">
          @for (option of options; track option.value) {
            <mat-option [value]="option.value">{{option.label}}</mat-option>
          }
        </mat-select>
        @if (selectFormControl.hasError('required')) {
          <mat-error>Sex is <strong>required</strong></mat-error>
        }
      </mat-form-field>
    `,
    styles: [`mat-form-field { width: 13.125rem; }`],
  }),
};
