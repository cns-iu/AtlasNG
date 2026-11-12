import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

/** Navigation entries listed in the sidenav. */
const NAV_ITEMS = [
  { icon: 'home', label: 'Home' },
  { icon: 'search', label: 'Explore' },
  { icon: 'bookmark', label: 'Saved' },
  { icon: 'settings', label: 'Settings' },
];

/** Styles that give the container a height so the sidenav has room to render. */
const SIDENAV_STYLES = [
  `mat-sidenav-container,
   mat-drawer-container {
      height: 25rem;
    }
  `,
  `.ang-sidenav--content {
      padding: 1rem;
    }
  `,
];

/** Navigation list rendered inside the sidenav. */
const NAV_LIST = `
  <mat-nav-list>
    @for (item of navItems; track item.label) {
      <a mat-list-item href="#" (click)="$event.preventDefault()">
        <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
        <span matListItemTitle>{{ item.label }}</span>
      </a>
    }
  </mat-nav-list>
`;

/** Main content with a button that toggles the sidenav. */
const CONTENT = `
  <div class="ang-sidenav--content">
    <button matButton="filled" (click)="sidenav.toggle()">Toggle sidenav</button>
    <p>Main content</p>
  </div>
`;

const meta: Meta<MatSidenav> = {
  title: 'Material/Sidenav',
  component: MatSidenav,
  args: {
    disableClose: false,
    mode: 'over',
    opened: false,
    position: 'start',
  },
  argTypes: {
    disableClose: {
      control: 'boolean',
      description: 'Whether the sidenav ignores backdrop clicks and the Escape key.',
    },
    mode: {
      control: 'select',
      description:
        'How the sidenav interacts with the content: over floats above it, push moves it, and side sits beside it.',
      options: ['over', 'push', 'side'],
    },
    opened: {
      control: 'boolean',
      description: 'Whether the sidenav is open.',
    },
    position: {
      control: 'select',
      description: 'Side of the container the sidenav is attached to.',
      options: ['start', 'end'],
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatButtonModule, MatIconModule, MatListModule, MatSidenavModule],
    }),
  ],
  render: (args) => ({
    props: { ...args, navItems: NAV_ITEMS },
    template: `
      <mat-sidenav-container>
        <mat-sidenav ${argsToTemplate(args)} #sidenav>${NAV_LIST}</mat-sidenav>
        <mat-sidenav-content>${CONTENT}</mat-sidenav-content>
      </mat-sidenav-container>
    `,
    styles: SIDENAV_STYLES,
  }),
};

export default meta;
type Story = StoryObj<MatSidenav>;

export const Over: Story = {};

export const Push: Story = {
  args: {
    mode: 'push',
    opened: true,
  },
};

export const Side: Story = {
  args: {
    mode: 'side',
    opened: true,
  },
};

export const EndPosition: Story = {
  args: {
    opened: true,
    position: 'end',
  },
};

export const Drawer: Story = {
  args: {
    mode: 'side',
    opened: true,
  },
  render: (args) => ({
    props: { ...args, navItems: NAV_ITEMS },
    template: `
      <mat-drawer-container>
        <mat-drawer ${argsToTemplate(args)} #sidenav>${NAV_LIST}</mat-drawer>
        <mat-drawer-content>${CONTENT}</mat-drawer-content>
      </mat-drawer-container>
    `,
    styles: SIDENAV_STYLES,
  }),
};
