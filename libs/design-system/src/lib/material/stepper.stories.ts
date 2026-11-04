import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

/** Organs offered in the sample details step. */
const ORGANS = ['Heart', 'Lungs', 'Kidney', 'Liver', 'Spleen', 'Pancreas'];

/** Styles that stack form fields and space out step actions. */
const STEPPER_STYLES = [
  `.ang-stepper--fields {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-top: 0.5rem;
    }
  `,
  `.ang-stepper--actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `,
  `mat-form-field { width: 13.125rem; }`,
];

const meta: Meta<MatStepper> = {
  title: 'Material/Stepper',
  component: MatStepper,
  args: {
    animationDuration: '500ms',
    disableRipple: false,
    headerPosition: 'top',
    labelPosition: 'end',
    linear: false,
    orientation: 'horizontal',
  },
  argTypes: {
    animationDuration: {
      control: 'text',
      description: 'Duration of the transition between step contents.',
    },
    disableRipple: {
      control: 'boolean',
      description: 'Whether ripples are disabled on the step headers.',
    },
    headerPosition: {
      control: 'select',
      description: 'Position of the step header relative to the content. Only applies in horizontal orientation.',
      options: ['top', 'bottom'],
    },
    labelPosition: {
      control: 'select',
      description: 'Position of the step labels relative to the icons. Only applies in horizontal orientation.',
      options: ['end', 'bottom'],
    },
    linear: {
      control: 'boolean',
      description: 'Whether each step must be completed and valid before moving to the next one.',
    },
    orientation: {
      control: 'select',
      description: 'Layout direction of the stepper.',
      options: ['horizontal', 'vertical'],
    },
  },
  decorators: [
    moduleMetadata({
      imports: [
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatStepperModule,
        ReactiveFormsModule,
      ],
    }),
  ],
  render: (args) => ({
    props: {
      ...args,
      contactForm: new FormGroup({
        name: new FormControl('', Validators.required),
        email: new FormControl('', [Validators.required, Validators.email]),
      }),
      sampleForm: new FormGroup({
        organ: new FormControl('', Validators.required),
        sampleId: new FormControl('', Validators.required),
      }),
      organs: ORGANS,
    },
    template: `
      <mat-stepper ${argsToTemplate(args)} aria-label="Sample submission" #stepper>
        <mat-step [stepControl]="contactForm" label="Contact details">
          <form class="ang-stepper--fields" [formGroup]="contactForm">
            <mat-form-field subscriptSizing="dynamic">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" required>
              @if (contactForm.controls.name.hasError('required')) {
                <mat-error>Name is <strong>required</strong></mat-error>
              }
            </mat-form-field>
            <mat-form-field subscriptSizing="dynamic">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" required>
              @if (contactForm.controls.email.hasError('required')) {
                <mat-error>Email is <strong>required</strong></mat-error>
              } @else if (contactForm.controls.email.hasError('email')) {
                <mat-error>Please enter a valid email address</mat-error>
              }
            </mat-form-field>
          </form>
          <div class="ang-stepper--actions">
            <button matButton="filled" matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step [stepControl]="sampleForm" label="Sample details">
          <form class="ang-stepper--fields" [formGroup]="sampleForm">
            <mat-form-field subscriptSizing="dynamic">
              <mat-label>Organ</mat-label>
              <mat-select formControlName="organ" required>
                @for (organ of organs; track organ) {
                  <mat-option [value]="organ">{{ organ }}</mat-option>
                }
              </mat-select>
              @if (sampleForm.controls.organ.hasError('required')) {
                <mat-error>Organ is <strong>required</strong></mat-error>
              }
            </mat-form-field>
            <mat-form-field subscriptSizing="dynamic">
              <mat-label>Sample ID</mat-label>
              <input matInput formControlName="sampleId" required>
              @if (sampleForm.controls.sampleId.hasError('required')) {
                <mat-error>Sample ID is <strong>required</strong></mat-error>
              }
            </mat-form-field>
          </form>
          <div class="ang-stepper--actions">
            <button matButton matStepperPrevious>Back</button>
            <button matButton="filled" matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step label="Review">
          <p>Submitting {{ sampleForm.value.organ || 'an organ' }} sample {{ sampleForm.value.sampleId || '' }}
            for {{ contactForm.value.name || 'an unnamed contact' }}.</p>
          <div class="ang-stepper--actions">
            <button matButton matStepperPrevious>Back</button>
            <button matButton="filled" (click)="stepper.reset()">Reset</button>
          </div>
        </mat-step>
      </mat-stepper>
    `,
    styles: STEPPER_STYLES,
  }),
};

export default meta;
type Story = StoryObj<MatStepper>;

export const Horizontal: Story = {};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
};

export const Linear: Story = {
  args: {
    linear: true,
  },
};

export const NonLinear: Story = {
  args: {
    linear: false,
  },
};
