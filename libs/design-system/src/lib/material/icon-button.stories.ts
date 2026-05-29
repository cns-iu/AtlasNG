import { Component, inject, input } from '@angular/core';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

interface CustomizationControls {
  icon?: string;
  tooltip?: string;
}

@Component({
  selector: 'ang-menu-demo',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  standalone: true,
  template: `
    <button mat-icon-button type="button" aria-label="Open menu" [matTooltip]="tooltip()" [matMenuTriggerFor]="menu">
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
  readonly tooltip = input();
}

@Component({
  selector: 'ang-snackbar-demo',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  standalone: true,
  template: `
    <button mat-icon-button type="button" aria-label="Open snackbar" [matTooltip]="tooltip()" (click)="openSnackbar()">
      <mat-icon>{{ icon() }}</mat-icon>
    </button>
  `,
})
class SnackbarDemoComponent {
  readonly icon = input('more_vert');
  readonly tooltip = input();

  private readonly snackbar = inject(MatSnackBar);

  openSnackbar(): void {
    this.snackbar.open('Snackbar opened from icon button', 'Close', { duration: 3000 });
  }
}

const meta: Meta<CustomizationControls> = {
  title: 'Material/Icon Button',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=24-876',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatButtonModule, MatIconModule, MatTooltipModule],
    }),
  ],
  args: {
    icon: 'more_vert',
    tooltip: 'Icon button tooltip',
  },
  render: (args) => ({
    props: args,
    template: `
      <a mat-icon-button aria-label="Example icon button" ${argsToTemplate(args, { exclude: ['tooltip'] })} [matTooltip]="tooltip">
        <mat-icon>${args.icon}</mat-icon>
      </a>
    `,
  }),
};
export default meta;
type Story = StoryObj<CustomizationControls>;

export const Default: Story = {};

export const AppsButton: Story = {
  args: {
    icon: 'apps',
    tooltip: 'Apps',
  },
};
export const HelpButton: Story = {
  args: {
    icon: 'help',
    tooltip: 'Help & documentation',
  },
};

export const MenuButton: Story = {
  args: {
    icon: 'menu',
    tooltip: 'Menu',
  },
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
  args: {
    icon: 'exclamation_mark',
    tooltip: 'Open snackbar',
  },
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
