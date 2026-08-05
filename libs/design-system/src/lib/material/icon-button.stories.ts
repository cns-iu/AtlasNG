import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';

interface CustomizationControls {
  icon?: string;
  tooltip?: string;
}

function buttonTemplate(menuVar = 'null'): string {
  return `
    <button matIconButton type="button"
      aria-label="Click me!"
      [matTooltip]="tooltip"
      [matMenuTriggerFor]="${menuVar}"
      (click)="onClick()"
    >
      <mat-icon [fontIcon]="icon" />
    </button>
  `;
}

const meta: Meta<CustomizationControls> = {
  title: 'Material/Icon Button',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=24-876',
    },
  },
  argTypes: {
    icon: {
      control: 'select',
      description: 'The name of the Material icon to display inside the button.',
      options: ['mail', 'apps', 'help', 'tune', 'menu', 'exclamation_mark'],
    },
    tooltip: {
      control: 'text',
      description: 'The tooltip text displayed when hovering over the button.',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
    }),
  ],
  render: (args) => ({
    props: {
      ...args,
      onClick: fn().mockName('buttonClick'),
    },
    template: buttonTemplate(),
  }),
};
export default meta;
type Story = StoryObj<CustomizationControls>;

export const Default: Story = {
  args: {
    icon: 'mail',
    tooltip: 'Icon button tooltip',
  },
};

export const WithMenu: Story = {
  args: {
    icon: 'menu',
    tooltip: 'Menu',
  },
  render: (args) => ({
    props: args,
    template: `
      ${buttonTemplate('menu')}

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
  }),
};
