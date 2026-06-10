import { Meta, StoryObj } from '@storybook/angular';
import { ProviderList } from './provider-list';

const meta: Meta<ProviderList> = {
  component: ProviderList,
  title: 'Labs/Cookie Modal/Provider List',
};

export default meta;
type Story = StoryObj<ProviderList>;

export const Default: Story = {
  args: {
    providers: [
      {
        label: 'Google Analytics',
        href: 'https://policies.google.com/privacy',
      },
      {
        label: 'YouTube',
        href: 'https://www.youtube.com/howyoutubeworks/user-settings/privacy/',
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    providers: [],
  },
};
