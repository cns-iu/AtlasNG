import { MatButton } from '@angular/material/button';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { BrandProfileCard, BrandProfileCardAction } from './brand-profile-card';

const meta: Meta<BrandProfileCard> = {
  title: 'Design System/Cards/Brand Profile Card',
  component: BrandProfileCard,
  subcomponents: { BrandProfileCardAction },
  args: {
    image: 'assets/placeholder-256x256.png',
    name: 'Jane Doe',
    description: 'Design leader focused on creating clear, inclusive digital experiences.',
    centered: false,
  },
  argTypes: {
    image: {
      control: 'text',
      description: 'The URL of the profile image.',
    },
    name: {
      control: 'text',
      description: 'The name displayed on the card.',
    },
    description: {
      control: 'text',
      description: 'The profile description displayed below the name.',
    },
    centered: {
      control: 'boolean',
      description: 'Whether the card content and actions are centered.',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [BrandProfileCardAction, MatButton],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <ang-brand-profile-card ${argsToTemplate(args)}>
        <a matButton="text" angBrandProfileCardAction href="https://example.com/profile" target="_blank">
          View profile
        </a>
        <button matButton="text" angBrandProfileCardAction type="button">Contact</button>
      </ang-brand-profile-card>
    `,
  }),
};

export default meta;
type Story = StoryObj<BrandProfileCard>;

export const Default: Story = {};

export const Centered: Story = {
  args: {
    centered: true,
  },
};

export const WithoutActions: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-brand-profile-card ${argsToTemplate(args)} />
    `,
  }),
};
