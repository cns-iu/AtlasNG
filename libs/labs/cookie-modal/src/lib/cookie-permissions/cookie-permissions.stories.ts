import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { AnalyticsPermissions } from '@atlasng/analytics/permissions';
import { Meta, StoryObj } from '@storybook/angular';
import { CookiePermissionProvidersByCategory } from '../provider-list/provider-list';
import { CookiePermissions } from './cookie-permissions';

const DEFAULT_PROVIDERS: CookiePermissionProvidersByCategory = {
  [AnalyticsEventCategory.Marketing]: [
    {
      label: 'Example Provider 1',
      href: 'https://example.com',
    },
    {
      label: 'Example Provider 2',
      href: 'https://example.com',
    },
  ],
};

const meta: Meta<CookiePermissions> = {
  title: 'Labs/Cookie Modal/Cookie Permissions',
  component: CookiePermissions,
  args: {
    permissions: AnalyticsPermissions.DEFAULT,
    providers: DEFAULT_PROVIDERS,
  },
};

export default meta;
type Story = StoryObj<CookiePermissions>;

export const Default: Story = {};
