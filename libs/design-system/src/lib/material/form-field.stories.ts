import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

interface CustomizationControls {
  disabled: boolean;
  showPrefixIcon: boolean;
  showClearButton: boolean;
  supportingText: string;
  appearance: MatFormFieldAppearance;
}

const meta: Meta<CustomizationControls> = {
  title: 'Material/Form Field',
  decorators: [
    moduleMetadata({
      imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatIconModule, MatButtonModule],
    }),
  ],
  args: {
    disabled: false,
    showPrefixIcon: false,
    showClearButton: false,
    supportingText: 'Supporting text',
    appearance: 'fill',
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

export const Input: Story = {
  render: (args) => ({
    props: args,
    template: `
      <mat-form-field [appearance]="appearance">
        <mat-label>Input</mat-label>
        @if (showPrefixIcon) {
          <mat-icon matPrefix>search</mat-icon>
        }
        <input matInput [disabled]="disabled" placeholder="Placeholder">
        @if (showClearButton) {
          <button matIconButton matSuffix aria-label="Clear input">
            <mat-icon>cancel</mat-icon>
          </button>
        }
        <mat-hint>${args.supportingText}</mat-hint>
      </mat-form-field>
    `,
    styles: [`mat-form-field { --mat-icon-button-state-layer-size: 3rem; width: 13.125rem; }`],
  }),
};

export const RequiredInputWithValidation: Story = {
  render: (args) => ({
    props: {
      ...args,
      emailFormControl: new FormControl({ value: '', disabled: args.disabled }, [
        Validators.email,
        Validators.required,
      ]),
    },
    template: `
      <mat-form-field [appearance]="appearance">
        <mat-label>Input</mat-label>
        @if (showPrefixIcon) {
          <mat-icon matPrefix>search</mat-icon>
        }
        <input type="email" matInput [formControl]="emailFormControl" placeholder="Enter email">
        @if (emailFormControl.hasError('email') && !emailFormControl.hasError('required')) {
          <mat-error>Please enter a valid email address</mat-error>
        }
        @if (emailFormControl.hasError('required')) {
          <mat-error>Email is <strong>required</strong></mat-error>
        }
        @if (emailFormControl.hasError('email')  && !emailFormControl.hasError('required')) {
          <mat-icon matSuffix>error</mat-icon>
        } @else if (emailFormControl.value && showClearButton) {
          <button matIconButton matSuffix aria-label="Clear input" (click)="emailFormControl.setValue('')">
            <mat-icon>cancel</mat-icon>
          </button>
        }
        <mat-hint>${args.supportingText}</mat-hint>
      </mat-form-field>
    `,
    styles: [`mat-form-field { --mat-icon-button-state-layer-size: 3rem; width: 13.125rem; }`],
  }),
};
