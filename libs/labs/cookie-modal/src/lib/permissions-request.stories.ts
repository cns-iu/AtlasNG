import {
  AnalyticsPermissions,
  provideAnalyticsPermissionsManagerConfig,
  provideInitialAnalyticsPermissions,
} from '@atlasng/analytics/permissions';
import { YouTubePlayer } from '@atlasng/design-system/youtube-player';
import { applicationConfig, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import 'storybook/test';
import { provideCookieModalPermissionsRequest } from './permissions-request';

const meta: Meta = {
  title: 'Labs/Cookie Modal/Permissions Request',
  decorators: [
    moduleMetadata({ imports: [YouTubePlayer] }),
    applicationConfig({
      providers: [
        provideCookieModalPermissionsRequest(),
        provideInitialAnalyticsPermissions(AnalyticsPermissions.DEFAULT),
        provideAnalyticsPermissionsManagerConfig({ changeEventName: false, storage: false, storageEvents: false }),
      ],
    }),
  ],
  render: () => ({ template: `<ang-youtube-player videoId="pzUFmDhQEO8" />` }),
};

export default meta;
type Story = StoryObj;

/** The YouTube player's "Enable cookies" button opens the cookie modal on Details with Marketing toggled on. */
export const YouTubePlayerRequest: Story = {
  name: 'YouTube Player Request',
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Enable cookies' }));
  },
};
