import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';

/** Data passed to the dialog content. */
interface DialogStoryData {
  /** Number of paragraphs rendered in the dialog content. */
  paragraphs: number;
}

/** Dialog content with a title, supporting text, and cancel and confirm actions. */
@Component({
  selector: 'ang-dialog-story-content',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Dialog title</h2>
    <mat-dialog-content>
      @for (paragraph of paragraphs; track paragraph) {
        <p>
          A dialog is a modal window that appears in front of app content to provide critical information or ask for a
          decision. Dialogs disable all app functionality when they appear and remain on screen until confirmed,
          dismissed, or a required action has been taken.
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>Cancel</button>
      <button matButton cdkFocusInitial [mat-dialog-close]="true">Confirm</button>
    </mat-dialog-actions>
  `,
})
class DialogStoryContent {
  /** Indexes used to repeat the supporting text paragraph. */
  readonly paragraphs = Array.from({ length: inject<DialogStoryData>(MAT_DIALOG_DATA).paragraphs }, (_, i) => i);
}

/** Button that opens the dialog with the story's configuration. */
@Component({
  selector: 'ang-dialog-story',
  imports: [MatButtonModule],
  template: `<button matButton="filled" (click)="open()">Open dialog</button>`,
})
class DialogStory {
  /** Whether the dialog ignores backdrop clicks and the Escape key. */
  readonly disableClose = input(false);
  /** Whether a backdrop is shown behind the dialog. */
  readonly hasBackdrop = input(true);
  /** Number of paragraphs in the dialog content. */
  readonly paragraphs = input(1);
  /** Emits the dialog result after it closes. */
  readonly closed = output<boolean | undefined>();

  private readonly dialog = inject(MatDialog);

  /** Opens the dialog and forwards its result to {@link closed}. */
  open(): void {
    const ref = this.dialog.open<DialogStoryContent, DialogStoryData, boolean>(DialogStoryContent, {
      data: { paragraphs: this.paragraphs() },
      disableClose: this.disableClose(),
      hasBackdrop: this.hasBackdrop(),
    });

    ref.afterClosed().subscribe((result) => this.closed.emit(result));
  }
}

const meta: Meta<DialogStory> = {
  title: 'Material/Dialog',
  component: DialogStory,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=1115-364',
    },
  },
  args: {
    closed: fn(),
    disableClose: false,
    hasBackdrop: true,
    paragraphs: 1,
  },
  argTypes: {
    disableClose: {
      control: 'boolean',
      description: 'Whether the dialog ignores backdrop clicks and the Escape key.',
    },
    hasBackdrop: {
      control: 'boolean',
      description: 'Whether a backdrop is shown behind the dialog.',
    },
    paragraphs: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
      description: 'Number of paragraphs in the dialog content. Content that overflows the viewport scrolls.',
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
  },
};

export default meta;
type Story = StoryObj<DialogStory>;

export const Default: Story = {};

export const ScrollingContent: Story = {
  args: {
    paragraphs: 12,
  },
};

export const DisableClose: Story = {
  args: {
    disableClose: true,
  },
};
