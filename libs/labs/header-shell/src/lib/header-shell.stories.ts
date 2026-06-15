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
    email: 'example@gmail.com',
  },
  render: (args) => ({
    props: args,
    template: `
      <ang-header-shell
        ${argsToTemplate(args, { exclude: ['navRight'] })}
        [localNavigationExpanded]="menuLeft.opened"
        (localNavigationToggle)="menuLeft.toggle()"
        (appsMenuToggle)="menuRight.toggle()"
      >
      </ang-header-shell>

      <mat-drawer-container class="example-container" hasBackdrop>
        <mat-drawer mode="over" position="start" #menuLeft>
          <ang-navigation-menu [navigationItems]="navigationItems" [email]="email"></ang-navigation-menu>
        </mat-drawer>
        <mat-drawer mode="over" position="end" #menuRight>
          <ang-navigation-menu [navigationItems]="navRight" [email]="email"></ang-navigation-menu>
        </mat-drawer>

        <mat-drawer-content>
          <div class="content">
            Test
          </div>
        </mat-drawer-content>
      </mat-drawer-container>
    `,
    styles: [`mat-drawer-content { height: calc(100vh - 3.5rem); } .content { padding: 1rem; }`],
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
