import { MatButton } from '@angular/material/button';
import { TextLink } from '@atlasng/design-system/text-link';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';
import {
  CookieBanner,
  CookieBannerAction,
  CookieBannerDescription,
  CookieBannerLogo,
  CookieBannerTitle,
} from './cookie-banner';

const TOGGLE_BUTTONS = `
  <div style="display: flex; gap: 16px; padding: 16px; border-bottom: 1px solid black;">
    <button matButton="filled" (click)="banner.open()">Open banner</button>
    <button matButton="filled" (click)="banner.close()">Close banner</button>
  </div>
`;

const meta: Meta<CookieBanner> = {
  title: 'Design System/Cookie Banner',
  component: CookieBanner,
  subcomponents: [CookieBannerLogo, CookieBannerTitle, CookieBannerDescription, CookieBannerAction],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=4497-607',
    },
    layout: 'fullscreen',
  },
  args: {
    privacyPolicy: 'https://example.com',
  },
  argTypes: {
    privacyPolicy: {
      control: 'text',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [
        CookieBanner,
        CookieBannerLogo,
        CookieBannerTitle,
        CookieBannerDescription,
        CookieBannerAction,
        MatButton,
        TextLink,
      ],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      ${TOGGLE_BUTTONS}

      <ang-cookie-banner ${argsToTemplate(args)} #banner />
    `,
  }),
};

export default meta;
type Story = StoryObj<CookieBanner>;

export const Default: Story = {};

export const CustomContent: Story = {
  render: (args) => ({
    props: args,
    template: `
      ${TOGGLE_BUTTONS}

      <ang-cookie-banner ${argsToTemplate(args)} #banner>
        <ang-cookie-banner-title>Wow, a custom title!</ang-cookie-banner-title>
        <ang-cookie-banner-description>
          This cookie banner has custom content. You can put whatever you want in here, like
          <a angTextLink href="https://www.example.com" target="_blank">text links</a>, icons, and more.
        </ang-cookie-banner-description>
        <button matButton="filled" angCookieBannerAction>Got it</button>
        <a matButton="tonal" angCookieBannerAction href="https://www.example.com" target="_blank" [closeOnClick]="false">Learn more</a>
      </ang-cookie-banner>
    `,
  }),
};

export const Animations: Story = {
  play: async ({ canvas, userEvent }) => {
    const headerText = 'Manage your privacy preferences';
    const openButton = canvas.getByRole('button', { name: 'Open banner' });
    const closeButton = canvas.getByRole('button', { name: 'Close banner' });

    // Verify banner appears immediately, i.e. no enter animation
    await expect(canvas.queryByText(headerText)).toBeInTheDocument();

    await userEvent.click(closeButton);
    await waitFor(() => expect(canvas.queryByText(headerText)).not.toBeInTheDocument(), { timeout: 2000 });

    await userEvent.click(openButton);
    await waitFor(() => expect(canvas.queryByText(headerText)).toBeInTheDocument(), { timeout: 2000 });
  },
};
