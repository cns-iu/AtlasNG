import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Meta, StoryObj } from '@storybook/angular';
import { createSnackBarConfig, Snackbar } from './snackbar';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'ang-snackbar-demo',
  imports: [MatButtonModule],
  template: ` <button mat-flat-button (click)="open()">Open Snackbar</button> `,
})
class SnackbarDemoComponent {
  readonly snackbar = inject(MatSnackBar);
  readonly message = input<string>('');
  readonly action = input<string>('');
  readonly showClose = input<boolean>(false);
  readonly multiline = input<boolean>(false);

  open() {
    this.snackbar.openFromComponent(
      Snackbar,
      createSnackBarConfig(this.message(), {
        action: this.action(),
        multiline: this.multiline(),
        showClose: this.showClose(),
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
  },
  args: {
    message: 'test message',
    action: 'test action',
    showClose: false,
    multiline: false,
  },
};
export default meta;
type Story = StoryObj;

export const SingleLineSnackbar: Story = {
  args: {
    message: 'Single-line snackbar',
    action: '',
    showClose: false,
  },
};

export const SingleLineSnackbarWithAction: Story = {
  args: {
    message: 'Single-line snackbar with action',
    action: 'Action',
    showClose: false,
  },
};

export const TwoLineSnackbarWithOutAction: Story = {
  args: {
    message: 'Two-line snackbar without action. This is some extra text',
    action: '',
    showClose: false,
  },
};

export const TwoLineSnackbarWithAction: Story = {
  args: {
    message: 'Two-line snackbar with action. This is some extra text',
    action: 'Action',
    showClose: false,
  },
};

export const TwoLineSnackbarWithLongerAction: Story = {
  args: {
    message:
      'Two-line snackbar with action. This is some extra text along with some more additional textTwo-line snackbar with action. This is some extra text along with some more additional textTwo-line snackbar with action. This is some extra text along with some more additional textTwo-line snackbar with action. This is some extra text along with some more additional text',
    action: 'Action',
    showClose: false,
    multiline: true,
  },
};

export const SingleLineSnackbarWithClose: Story = {
  args: {
    message: 'Single-line snackbar with close',
    action: '',
    showClose: true,
  },
};

export const SingleLineSnackbarWithActionAndClose: Story = {
  args: {
    message: 'Single-line with action & close',
    action: 'Action',
    showClose: true,
  },
};

export const TwoLineSnackbarWithoutActionAndClose: Story = {
  args: {
    message: 'Two-line snackbar without action, with close',
    action: '',
    showClose: true,
  },
};

export const TwoLineSnackbarWithActionAndClose: Story = {
  args: {
    message: 'Two-line snackbar with action and close',
    action: 'Action',
    showClose: true,
  },
};

export const TwoLineSnackbarWithLongerActionAndClose: Story = {
  args: {
    message:
      'Two-line snackbar with action. This is some extra text along with some more additional textTwo-line snackbar with action. This is some extra text along with some more additional textTwo-line snackbar with action. This is some extra text along with some more additional textTwo-line snackbar with action. This is some extra text along with some more additional text',
    action: 'Action',
    showClose: true,
    multiline: true,
  },
};
