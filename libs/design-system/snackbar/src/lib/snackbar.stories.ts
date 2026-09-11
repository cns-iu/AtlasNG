import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Meta, StoryObj } from '@storybook/angular';
import { createSnackBarConfig, Snackbar } from './snackbar';

@Component({
  selector: 'ang-snackbar-demo',
  imports: [MatButtonModule],
  template: ` <button mat-flat-button (click)="open()">Open Snackbar</button> `,
})
class SnackbarDemoComponent {
  readonly snackbar = inject(MatSnackBar);
  readonly message = input<string>('');
  readonly action = input<string>();
  readonly showClose = input<boolean>();
  readonly actionRow = input<boolean>();
  readonly duration = input<number>();

  open() {
    this.snackbar.openFromComponent(
      Snackbar,
      createSnackBarConfig(this.message(), {
        action: this.action(),
        actionRow: this.actionRow(),
        showClose: this.showClose(),
        duration: this.duration(),
      }),
    );
  }
}

const meta: Meta<SnackbarDemoComponent> = {
  component: SnackbarDemoComponent,
  title: 'Design System / Snackbar',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=1045-242',
    },
  },
  argTypes: {
    message: {
      type: 'string',
    },
    action: {
      type: 'string',
    },
    duration: {
      type: 'number',
    },
  },
  args: {
    action: 'Action',
    showClose: false,
    actionRow: false,
    duration: 5000,
  },
};
export default meta;
type Story = StoryObj;

export const SingleLineSnackbar: Story = {
  args: {
    message: 'Single-line snackbar',
    action: undefined,
    showClose: false,
  },
};

export const SingleLineSnackbarWithAction: Story = {
  args: {
    message: 'Single-line snackbar with action',
    showClose: false,
  },
};

export const TwoLineSnackbarWithoutAction: Story = {
  args: {
    message: 'Two-line snackbar without action. This is a longer message that will wrap.',
    action: undefined,
    showClose: false,
  },
};

export const TwoLineSnackbarWithAction: Story = {
  args: {
    message: 'Two-line snackbar with action. This is a longer message that will wrap.',
    showClose: false,
  },
};

export const TwoLineSnackbarWithLongerAction: Story = {
  args: {
    message: 'Two-line snackbar with longer action. This is a longer message that will wrap.',
    showClose: false,
    actionRow: true,
  },
};

export const SingleLineSnackbarWithClose: Story = {
  args: {
    message: 'Single-line snackbar with close affordance',
    action: undefined,
    showClose: true,
  },
};

export const SingleLineSnackbarWithActionAndClose: Story = {
  args: {
    message: 'Single-line snackbar with action',
    showClose: true,
  },
};

export const TwoLineSnackbarWithClose: Story = {
  args: {
    message: 'Two-line snackbar with close affordance. This is a longer message that will wrap.',
    action: undefined,
    showClose: true,
  },
};

export const TwoLineSnackbarWithActionAndClose: Story = {
  args: {
    message: 'Two-line snackbar with action and close affordance.',
    showClose: true,
  },
};

export const TwoLineSnackbarWithLongerActionAndClose: Story = {
  args: {
    message: 'Two-line snackbar with longer action and close affordance.',
    showClose: true,
    actionRow: true,
  },
};
