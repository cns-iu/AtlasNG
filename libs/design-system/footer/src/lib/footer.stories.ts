import { MatButton } from '@angular/material/button';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { Footer, FooterAction, FooterLogo } from './footer';

const SOCIALS = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/aaa',
    classes: ['linkedin'],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    url: 'https://www.youtube.com/bbb',
    classes: ['youtube'],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/ccc',
    classes: ['instagram'],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    url: 'https://www.facebook.com/ddd',
    classes: ['facebook'],
  },
  {
    id: 'github',
    label: 'GitHub',
    url: 'https://github.com/eee',
    classes: ['github'],
  },
  {
    id: 'bluesky',
    label: 'Bluesky',
    url: 'https://bsky.app/fff',
    classes: ['bluesky'],
  },
  {
    id: 'x',
    label: 'X (formerly Twitter)',
    url: 'https://twitter.com/ggg',
    classes: ['x'],
  },
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
      imports: [FooterAction, FooterLogo, MatButton],
    }),
  ],
  args: {
    logoUrl: 'assets/logo-placeholder.svg',
    logoAlt: 'Organization Logo',
    socials: SOCIALS,
    org: '[Name with hyperlink]',
    orgLink: 'https://www.example.com',
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const CustomLogo: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-footer ${argsToTemplate(args)} data-testid="footer" #footer>
        <a angFooterLogo target="_blank" [angAnyLink]="orgLink">
          Custom logo (or anything else) can be projected here
        </a>
      </ang-footer>
    `,
  }),
};

export const CustomActions: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-footer ${argsToTemplate(args)} data-testid="footer" #footer>
        <a matButton="tonal" angFooterAction href="https://www.example.com" target="_blank">Learn more</a>
      </ang-footer>
    `,
  }),
};
