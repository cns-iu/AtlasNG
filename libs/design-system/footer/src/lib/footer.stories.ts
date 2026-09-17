import { MatButton } from '@angular/material/button';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { Footer, FooterAction, FooterLogo } from './footer';
import { SocialMediaButtonDefinition } from '@atlasng/design-system/buttons/social-media-button';

const SOCIALS: (string | SocialMediaButtonDefinition)[] = [
  'linkedin',
  'youtube',
  'instagram',
  'facebook',
  'github',
  'bluesky',
  'x',
  { id: 'mail', label: 'Email', url: 'mailto:example@gmail.com', fontIcon: 'mail' },
];

const meta: Meta = {
  title: 'Design System/Footer',
  component: Footer,
  subcomponents: {
    FooterAction,
    FooterLogo,
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=6381-1345',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [FooterAction, MatButton],
    }),
  ],
  args: {
    socials: SOCIALS,
    logoImage: 'assets/logo-placeholder.svg',
    organization: 'Cyberinfrastructure for Network Science Center',
    organizationLink: 'https://www.example.com',
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const CustomLogo: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-footer ${argsToTemplate(args)}>
        <ang-footer-logo>
          Custom logo (or something else) can be projected here
        </ang-footer-logo>
      </ang-footer>
    `,
  }),
};

export const CustomActions: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-footer ${argsToTemplate(args)}>
        <a angFooterAction matButton>Privacy Policy</a>
        <a angFooterAction matButton>Terms of Service</a>
        <a angFooterAction matButton>Contact Us</a>
        <a angFooterAction matButton>Help</a>
        <a angFooterAction matButton>Feedback</a>
        <a angFooterAction matButton>Careers</a>
      </ang-footer>
    `,
  }),
};
