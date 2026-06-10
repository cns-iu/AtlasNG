import { MatMenuModule } from '@angular/material/menu';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { HeaderShell } from './header-shell';
import { NavigationToggle } from '@atlasng/design-system/buttons/navigation-toggle';
import { NavigationButton } from '@atlasng/design-system/buttons/navigation';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';

const meta: Meta<HeaderShell> = {
  title: 'Design System/Header Shell',
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
      imports: [MatMenuModule, NavigationToggle, NavigationButton, MatSidenavModule, MatFormFieldModule],
    }),
  ],
  args: {
    logoLink: '/',
    logoUrl: 'assets/placeholder.svg',
    // hasLocalNavigation: true,
    localNavigationIcon: 'menu',
    navigationItems: [
      { id: 'link-1', label: 'Link 1', link: '/link-1' },
      { id: 'link-2', label: 'Link 2', link: '/link-2' },
      { id: 'link-3', label: 'Link 3', link: '/link-3' },
      { id: 'link-4', label: 'Link 4', link: '/link-4' },
      { id: 'link-5', label: 'Link 5', menu: undefined },
    ],
    // iconActions: [
    //   { id: 'notify', icon: 'notifications', ariaLabel: 'Notifications', tooltip: 'Notifications' },
    //   { id: 'alerts', icon: 'info', ariaLabel: 'Alerts', tooltip: 'Alerts' },
    // ],
  },
  // argTypes: {
  //   hasLocalNavigation: {
  //     control: 'boolean',
  //     description: 'Whether to show the local navigation toggle button.',
  //   },
  // },
  render: (args) => ({
    props: args,
    template: `
      <mat-menu #linkFiveMenu="matMenu">
        <button mat-menu-item type="button">Link 5A</button>
        <button mat-menu-item type="button">Link 5B</button>
      </mat-menu>

      <ang-header-shell
        ${argsToTemplate(args)}
        [navigationItems]="[
          navigationItems[0],
          navigationItems[1],
          navigationItems[2],
          navigationItems[3],
          { ...navigationItems[4], menu: linkFiveMenu }
        ]"
        (localNavigationToggle)="sidenav.toggle()"
        (appsMenuToggle)="appsSidenav.toggle()"
      >
      </ang-header-shell>

      <mat-sidenav-container class="example-container" hasBackdrop>
        <mat-sidenav mode="over" #sidenav>
          @for (item of navigationItems; track item.id) {
            @if (item.menu) {
              <ang-navigation-toggle
                [selected]="openedNavigationMenuId() === item.id"
                [matMenuTriggerFor]="item.menu"
                [matTooltip]="item.tooltip"
                (menuOpened)="openNavigationMenu(item.id)"
                (menuClosed)="closeNavigationMenu(item.id)"
              >
                {{ item.label }}
              </ang-navigation-toggle>
            } @else {
              <ang-navigation-button [link]="item.link">
                {{ item.label }}
              </ang-navigation-button>
            }
          }
        </mat-sidenav>

        <mat-sidenav mode="over" #appsSidenav position="end">
          <button mat-menu-item type="button">AtlasNG</button>
          <button mat-menu-item type="button">Insights</button>
          <button mat-menu-item type="button">Resources</button>

        </mat-sidenav>
        <mat-sidenav-content>
          Test
        </mat-sidenav-content>
      </mat-sidenav-container>
    `,
    styles: [`mat-sidenav-content { height: 140vh; }`],
  }),
};

export default meta;
type Story = StoryObj<HeaderShell>;

export const Default: Story = {};

export const WithHelp: Story = {
  args: {
    helpLink: '/docs/header-shell',
    // iconActions: [
    //   { id: 'notify', icon: 'notifications', ariaLabel: 'Notifications', tooltip: 'Notifications' },
    //   { id: 'alerts', icon: 'info', ariaLabel: 'Alerts', tooltip: 'Alerts' },
    //   { id: 'history', icon: 'history', ariaLabel: 'History', tooltip: 'History' },
    //   { id: 'bookmark', icon: 'bookmark', ariaLabel: 'Bookmarks', tooltip: 'Bookmarks' },
    //   { id: 'flag', icon: 'flag', ariaLabel: 'Flags', tooltip: 'Flags' },
    // ],
  },
};
