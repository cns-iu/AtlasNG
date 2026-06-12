import { Meta, StoryObj } from '@storybook/angular';

import { YoutubePlayer } from './youtube-player';

const meta: Meta<YoutubePlayer> = {
  component: YoutubePlayer,
  title: 'Design System/YouTube Player',
  args: {
    videoId: 'pzUFmDhQEO8',
    label: 'Example YouTube Video',
    hasCookiesEnabled: true,
  },
  argTypes: {
    videoId: {
      control: 'text',
      description: 'The YouTube video ID',
    },
    hasCookiesEnabled: {
      control: 'boolean',
      description: 'Whether marketing cookies are enabled',
    },
  },
};

export default meta;
type Story = StoryObj<YoutubePlayer>;

export const Default: Story = {};

export const CookiesDisabled: Story = {
  args: {
    hasCookiesEnabled: false,
  },
};
