import { MatButton } from '@angular/material/button';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { Footer, FooterAction, FooterActionGroup, FooterActionGroupLink, FooterLogo } from './footer';
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

/**
 * Builds the template of a placeholder link group like the ones in the Figma spec.
 *
 * @param linkCount - Number of links in the group.
 * @returns Group markup with alternating "Webpage Title" and "Webpage Label" links.
 */
function placeholderGroup(linkCount: number): string {
  const links = Array.from(
    { length: linkCount },
    (_, index) => `<a angFooterActionGroupLink href="#">${index % 2 === 0 ? 'Webpage Title' : 'Webpage Label'}</a>`,
  );
  return `<ang-footer-action-group category="Website Category">${links.join('')}</ang-footer-action-group>`;
}

const meta: Meta = {
  title: 'Design System/Footer',
  component: Footer,
  subcomponents: {
    FooterAction,
    FooterActionGroup,
    FooterActionGroupLink,
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
      imports: [FooterAction, FooterActionGroup, FooterActionGroupLink, MatButton],
    }),
  ],
  args: {
    socials: SOCIALS,
    logoImage: 'assets/logo-placeholder.svg',
    organization: 'Cyberinfrastructure for Network Science Center',
  },
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {};

export const BasicWithoutSocials: Story = {
  args: {
    socials: [],
  },
};

export const BasicWithCustomLogo: Story = {
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

export const BasicWithCustomActions: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Layout for custom actions has not been designed yet and may change.',
      },
    },
  },
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

export const CustomActions: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-footer ${argsToTemplate(args)}>
        ${[4, 5, 3].map(placeholderGroup).join('')}
      </ang-footer>
    `,
  }),
};

export const CustomActionsWithManyGroups: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-footer ${argsToTemplate(args)}>
        ${[4, 5, 5, 3, 5, 5].map(placeholderGroup).join('')}
      </ang-footer>
    `,
  }),
};
