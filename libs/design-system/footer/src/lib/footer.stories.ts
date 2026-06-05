import { Meta, StoryObj } from '@storybook/angular';
import { Footer } from './footer';

const meta: Meta = {
  title: 'Design System/Footer',
  component: Footer,
  args: {
    logoUrl: 'assets/wpp.svg',
    socials: ['linkedin', 'youtube', 'instagram', 'facebook', 'github', 'bluesky', 'x'],
    orgName: 'Whole Person Physiome',
    orgLink: 'https://www.cns.edu',
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};
