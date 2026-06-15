import { MatSidenavModule } from '@angular/material/sidenav';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { HeaderShell, HeaderShellNavigationItem } from './header-shell';
import { NavigationMenu } from './navigation-menu/navigation-menu';

const NAVIGATION_ITEMS: HeaderShellNavigationItem[] = [
  { id: 'link-1', label: 'Link 1', link: '/link-1', icon: 'home' },
  { id: 'link-2', label: 'Link 2', link: '/link-2', icon: 'info' },
  { id: 'link-3', label: 'Link 3', link: '/link-3', icon: 'settings' },
  { id: 'link-4', label: 'Link 4', link: '/link-4', icon: 'help' },
];

const APP_MENU_ITEMS: HeaderShellNavigationItem[] = [
  { id: 'app-link-1', label: 'App Link 1', link: '/app-link-1' },
  { id: 'app-link-2', label: 'App Link 2', link: '/app-link-2' },
];

const SOCIAL_MEDIA_IDS = ['linkedin', 'youtube', 'github', 'bluesky', 'instagram', 'facebook', 'x'];

interface WithMenuItems {
  navRight?: HeaderShellNavigationItem[];
  email?: string;
}

const meta: Meta<HeaderShell & WithMenuItems> = {
  title: 'Labs/Header Shell',
  component: HeaderShell,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=6715-15323',
    },
    layout: 'fullscreen',
  },
  decorators: [
    moduleMetadata({
      imports: [MatSidenavModule, NavigationMenu],
    }),
  ],
  args: {
    logoLink: '/',
    logoUrl: 'assets/placeholder.svg',
    hasLocalNavigation: true,
    localNavigationIcon: 'menu',
    navigationItems: NAVIGATION_ITEMS,
    navRight: APP_MENU_ITEMS,
  },
  render: (args) => ({
    props: {
      ...args,
      leftMenuOpen: false,
      rightMenuOpen: false,
      socialMediaIds: SOCIAL_MEDIA_IDS,
      email: 'example@gmail.com',
    },
    template: `
      <ang-header-shell
        ${argsToTemplate(args, { exclude: ['navRight'] })}
        [(localNavigationExpanded)]="leftMenuOpen"
        (localNavigationToggle)="leftMenuOpen = !leftMenuOpen; rightMenuOpen = false"
        (appsMenuToggle)="rightMenuOpen = !rightMenuOpen; leftMenuOpen = false"
      >
      </ang-header-shell>

      <mat-drawer-container class="example-container" hasBackdrop>
        <mat-drawer
          mode="over"
          position="start"
          [opened]="leftMenuOpen"
          (openedChange)="leftMenuOpen = $event"
        >
          <ang-navigation-menu [navigationItems]="navigationItems" [email]="email" [socialMediaIds]="socialMediaIds"></ang-navigation-menu>
        </mat-drawer>
        <mat-drawer
          mode="over"
          position="end"
          [opened]="rightMenuOpen"
          (openedChange)="rightMenuOpen = $event"
        >
          <ang-navigation-menu [navigationItems]="navRight" [email]="email" [socialMediaIds]="socialMediaIds"></ang-navigation-menu>
        </mat-drawer>

        <mat-drawer-content>
          <div class="content">
            Test
          </div>
        </mat-drawer-content>
      </mat-drawer-container>
    `,
    styles: [`mat-drawer-content { height: calc(100vh - 3.5rem); background: #F6F7F8 } .content { padding: 1rem; }`],
  }),
};

export default meta;
type Story = StoryObj<HeaderShell & WithMenuItems>;

export const Default: Story = {};

export const WithHelp: Story = {
  args: {
    helpLink: '/docs/header-shell',
  },
};
