import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { Meta, StoryObj } from '@storybook/angular';
import { CookiePermissionProvider } from '../provider-list/provider-list';
import { CookiePermissionInfo, CookiePermissionItem } from './cookie-permission-item';

const DEFAULT_INFO: CookiePermissionInfo = {
  category: AnalyticsEventCategory.Statistics,
  title: 'Statistics',
  description: 'Description for statistics cookies',
};

const DEFAULT_PROVIDERS: CookiePermissionProvider[] = [
  {
    label: 'Test Provider',
    href: 'https://example.com',
  },
];

const meta: Meta<CookiePermissionItem> = {
  title: 'Labs/Cookie Modal/Cookie Permission Item',
  component: CookiePermissionItem,
  args: {
    info: DEFAULT_INFO,
    enabled: false,
    providers: DEFAULT_PROVIDERS,
  },
};

export default meta;
type Story = StoryObj<CookiePermissionItem>;

export const Default: Story = {};

export const WithoutProviders: Story = {
  args: {
    providers: [],
  },
};

export const Required: Story = {
  args: {
    info: {
      ...DEFAULT_INFO,
      required: true,
    },
    enabled: true,
  },
};
