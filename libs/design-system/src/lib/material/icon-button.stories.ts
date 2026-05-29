import { Component, inject, input } from '@angular/core';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    <button mat-icon-button type="button" [aria-label]="tooltip()" [matTooltip]="tooltip()" [matMenuTriggerFor]="menu">
      <mat-icon [fontIcon]="icon()"></mat-icon>
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
  readonly icon = input<string>();
  readonly tooltip = input<string>();
}

@Component({
  selector: 'ang-snackbar-demo',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  standalone: true,
  template: `
    <button mat-icon-button type="button" [aria-label]="tooltip()" [matTooltip]="tooltip()" (click)="openSnackbar()">
      <mat-icon [fontIcon]="icon()"></mat-icon>
    </button>
  `,
})
class SnackbarDemoComponent {
  readonly icon = input<string>();
  readonly tooltip = input<string>();

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
  argTypes: {
    icon: {
      control: 'select',
      description: 'The name of the Material icon to display inside the button.',
      options: ['more_vert', 'apps', 'help', 'tune', 'menu', 'exclamation_mark'],
    },
    tooltip: {
      control: 'text',
      description: 'The tooltip text displayed when hovering over the button.',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <a mat-icon-button aria-label="Example icon button" ${argsToTemplate(args, { exclude: ['tooltip'] })} [matTooltip]="tooltip">
        <mat-icon fontIcon="${args.icon}"></mat-icon>
      </a>
    `,
  }),
};
export default meta;
type Story = StoryObj<CustomizationControls>;

export const Default: Story = {
  args: {
    icon: 'more_vert',
    tooltip: 'Icon button tooltip',
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
