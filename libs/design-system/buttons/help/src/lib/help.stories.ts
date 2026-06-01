import { Meta, StoryObj } from '@storybook/angular';

import { MatIconModule } from '@angular/material/icon';
import { Help } from './help';
import { MatMenuModule } from '@angular/material/menu';

const meta: Meta<Help> = {
  title: 'Design System/Buttons/Help',
  component: Help,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=24-876',
    },
  },
  argTypes: {
    link: {
      control: 'text',
      description: 'The URL to navigate to when the button is clicked.',
    },
  },
};
export default meta;
type Story = StoryObj<Help>;

export const HelpLink: Story = {
  args: {
    link: 'https://example.com',
  },
};

export const HelpMenu: Story = {
  render: () => ({
    template: `
    <ang-help [menu]="menu"/>

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
      imports: [MatMenuModule, MatIconModule],
    },
  }),
};
