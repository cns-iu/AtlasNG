import { Meta, StoryObj } from '@storybook/angular';
import { Footer } from './footer';

const meta: Meta = {
  title: 'Labs/Footer',
  component: Footer,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=6381-1345',
    },
  },
  args: {
    logoUrl: 'assets/placeholder.svg',
    logoAlt: 'Organization Logo',
    socials: ['linkedin', 'youtube', 'instagram', 'facebook', 'github', 'bluesky', 'x'],
    orgName: '[Name with hyperlink]',
    orgLink: 'https://www.example.com',
    email: 'example@gmail.com',
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};
