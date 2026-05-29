import { Component, inject, input } from '@angular/core';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

interface CustomizationControls {
  icon?: string;
}

@Component({
  selector: 'ang-snackbar-demo',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  standalone: true,
  template: `
    <button
      mat-icon-button
      type="button"
      aria-label="Open snackbar"
      matTooltip="Open snackbar"
      (click)="openSnackbar()"
    >
      <mat-icon>{{ icon() }}</mat-icon>
    </button>
  `,
})
class SnackbarDemoComponent {
  readonly icon = input('more_vert');

  private readonly snackbar = inject(MatSnackBar);

  openSnackbar(): void {
    this.snackbar.open('Snackbar opened from icon button', 'Close', { duration: 3000 });
  }
}

@Component({
  selector: 'ang-menu-demo',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  standalone: true,
  template: `
    <button mat-icon-button type="button" aria-label="Open menu" matTooltip="Open menu" [matMenuTriggerFor]="menu">
      <mat-icon>{{ icon() }}</mat-icon>
    </button>

    <mat-menu #menu="matMenu">
      <button mat-menu-item type="button">
        <mat-icon>edit</mat-icon>
        <span>Edit</span>
      </button>
      <button mat-menu-item type="button">
        <mat-icon>share</mat-icon>
        <span>Share</span>
      </button>
      <button mat-menu-item type="button">
        <mat-icon>delete</mat-icon>
        <span>Delete</span>
      </button>
    </mat-menu>
  `,
})
class MenuDemoComponent {
  readonly icon = input('more_vert');
}

const meta: Meta<CustomizationControls> = {
  title: 'Material/Icon Button',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=24-876',
    },
  },
  args: {
    icon: 'more_vert',
  },
  argTypes: {
    icon: {
      type: 'string',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, MatSnackBarModule],
    }),
  ],
};
export default meta;
type Story = StoryObj<CustomizationControls>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <a mat-icon-button aria-label="Example icon button" ${argsToTemplate(args)} matTooltip="Tooltip text">
        <mat-icon>${args.icon}</mat-icon>
      </a>
    `,
  }),
};

export const WithMenu: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-menu-demo ${argsToTemplate(args)}></ang-menu-demo>
    `,
    moduleMetadata: {
      imports: [MenuDemoComponent],
    },
  }),
};

export const WithSnackbar: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-snackbar-demo ${argsToTemplate(args)}></ang-snackbar-demo>
    `,
    moduleMetadata: {
      imports: [SnackbarDemoComponent],
    },
  }),
};
