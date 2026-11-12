import { Component, inject, input, output } from '@angular/core';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';

/** Actions listed in the bottom sheet. */
const ACTIONS = [
  { icon: 'link', label: 'Copy link', description: 'Copy a link to this page' },
  { icon: 'share', label: 'Share', description: 'Share this page with others' },
  { icon: 'download', label: 'Download', description: 'Save a copy of this page' },
  { icon: 'print', label: 'Print', description: 'Print this page' },
];

/** Bottom sheet content listing actions that close the sheet with the chosen action. */
@Component({
  selector: 'ang-bottom-sheet-story-content',
  imports: [MatIconModule, MatListModule],
  template: `
    <mat-nav-list>
      @for (action of actions; track action.label) {
        <a mat-list-item href="#" (click)="select(action.label, $event)">
          <mat-icon matListItemIcon>{{ action.icon }}</mat-icon>
          <span matListItemTitle>{{ action.label }}</span>
          <span matListItemLine>{{ action.description }}</span>
        </a>
      }
    </mat-nav-list>
  `,
})
class BottomSheetStoryContent {
  /** Actions shown in the list. */
  readonly actions = ACTIONS;

  private readonly ref = inject<MatBottomSheetRef<BottomSheetStoryContent, string>>(MatBottomSheetRef);

  /**
   * Closes the sheet with the selected action.
   * @param label Label of the selected action.
   * @param event Click event, prevented so the placeholder link does not navigate.
   */
  select(label: string, event: MouseEvent): void {
    event.preventDefault();
    this.ref.dismiss(label);
  }
}

/** Button that opens the bottom sheet with the story's configuration. */
@Component({
  selector: 'ang-bottom-sheet-story',
  imports: [MatButtonModule],
  template: `<button matButton="filled" (click)="open()">Open bottom sheet</button>`,
})
class BottomSheetStory {
  /** Whether the sheet ignores backdrop clicks and the Escape key. */
  readonly disableClose = input(false);
  /** Whether a backdrop is shown behind the sheet. */
  readonly hasBackdrop = input(true);
  /** Emits the selected action after the sheet closes. */
  readonly dismissed = output<string | undefined>();

  private readonly bottomSheet = inject(MatBottomSheet);

  /** Opens the sheet and forwards its result to {@link dismissed}. */
  open(): void {
    const ref = this.bottomSheet.open<BottomSheetStoryContent, void, string>(BottomSheetStoryContent, {
      disableClose: this.disableClose(),
      hasBackdrop: this.hasBackdrop(),
    });

    ref.afterDismissed().subscribe((result) => this.dismissed.emit(result));
  }
}

const meta: Meta<BottomSheetStory> = {
  title: 'Material/Bottom Sheet',
  component: BottomSheetStory,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=4132-1621',
    },
  },
  args: {
    disableClose: false,
    dismissed: fn(),
    hasBackdrop: true,
  },
  argTypes: {
    disableClose: {
      control: 'boolean',
      description: 'Whether the sheet ignores backdrop clicks and the Escape key.',
    },
    hasBackdrop: {
      control: 'boolean',
      description: 'Whether a backdrop is shown behind the sheet.',
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open bottom sheet' }));
  },
};

export default meta;
type Story = StoryObj<BottomSheetStory>;

export const Default: Story = {};

export const DisableClose: Story = {
  args: {
    disableClose: true,
  },
};
