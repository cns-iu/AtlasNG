import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { HeaderShell, HeaderShellNavigationItem } from './header-shell';
import { NavigationContainer } from './navigation-container/navigation-container';

const NAVIGATION_ITEMS: HeaderShellNavigationItem[] = [
  { id: 'link-1', label: 'Link 1', link: '/link-1', icon: 'home' },
  { id: 'link-2', label: 'Link 2', link: '/link-2', icon: 'info' },
  { id: 'link-3', label: 'Link 3', link: '/link-3', icon: 'settings' },
  { id: 'link-4', label: 'External Link', link: 'http://www.example.com', icon: 'help', external: true },
];

const APP_MENU_ITEMS: HeaderShellNavigationItem[] = [
  { id: 'app-link-1', label: 'App Link 1', link: 'http://www.example.com', external: true },
  { id: 'app-link-2', label: 'App Link 2', link: 'http://www.example.com', external: true },
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
      imports: [NavigationContainer],
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
        [localNavigationExpanded]="navigation.leftMenuOpen()"
        (localNavigationToggle)="navigation.localNavigationToggle()"
        (appsMenuToggle)="navigation.appsMenuToggle()"
      >
      </ang-header-shell>

      <ang-navigation-container
        [navigationItems]="navigationItems"
        [navRight]="navRight"
        [email]="email"
        [socialMediaIds]="socialMediaIds"
        #navigation
      >
        <div class="content">
          Test
        </div>
      </ang-navigation-container>
    `,
    styles: [`.content { padding: 1rem; background: #f6f7f8; }`],
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
