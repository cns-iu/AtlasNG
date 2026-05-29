import { Component } from '@angular/core';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuPanel } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HelpButton } from './help-button';

interface CustomizationControls {
  menu?: MatMenuPanel<unknown>;
  link?: string;
}

const meta: Meta<HelpButton & CustomizationControls> = {
  title: 'Design System/Buttons/Help Button',
  component: HelpButton,
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
    link: {
      control: 'text',
      description: 'The URL to navigate to when the button is clicked.',
    },
  },
};
export default meta;
type Story = StoryObj<HelpButton & CustomizationControls>;

export const HelpLink: Story = {
  args: {
    link: 'https://example.com',
  },
};

export const HelpMenu: Story = {
  render: () => ({
    template: `
    <ang-help-button [menu]="menu"/>

    <mat-menu #menu="matMenu">
      <button mat-menu-item type="button">
        <mat-icon>book</mat-icon>
        <span>Documentation</span>
      </button>
      <button mat-menu-item type="button">
        <mat-icon>help</mat-icon>
        <span>Support</span>
      </button>
    </mat-menu>
  `,
    moduleMetadata: {
      imports: [HelpButton, MatMenuModule],
    },
  }),
};
