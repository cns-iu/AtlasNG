import { MatButton } from '@angular/material/button';
import { TextLink } from '@atlasng/design-system/text-link';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';
import {
  CookieBanner,
  CookieBannerAction,
  CookieBannerContainer,
  CookieBannerDescription,
  CookieBannerLogo,
  CookieBannerTitle,
} from './cookie-banner';

const TOGGLE_BUTTONS = `
  <div style="display: flex; gap: 16px; padding: 16px; border-bottom: 1px solid #1C1B1E;">
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
        CookieBannerContainer,
        MatButton,
        TextLink,
      ],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      ${TOGGLE_BUTTONS}

      <ang-cookie-banner ${argsToTemplate(args)} data-testid="cookie-banner" #banner />
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

      <ang-cookie-banner ${argsToTemplate(args)} data-testid="cookie-banner" #banner>
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

export const EmbeddedContainer: Story = {
  render: (args) => ({
    props: args,
    template: `
      ${TOGGLE_BUTTONS}

      <div angCookieBannerContainer style="height: 100px; border-bottom: 1px solid #1C1B1E;">
        <ang-cookie-banner ${argsToTemplate(args)} data-testid="cookie-banner" #banner />
      </div>

      <p>Additional content after "embedded" cookie banner.</p>
    `,
  }),
};

export const ScrollableContainer: Story = {
  render: (args) => ({
    props: args,
    template: `
      ${TOGGLE_BUTTONS}
      <div style="height: 150vh;"></div>

      <ang-cookie-banner ${argsToTemplate(args)} data-testid="cookie-banner" #banner />
    `,
  }),
};

export const Animations: Story = {
  play: async ({ canvas, userEvent }) => {
    const banner = canvas.getByTestId('cookie-banner');
    const openButton = canvas.getByRole('button', { name: 'Open banner' });
    const closeButton = canvas.getByRole('button', { name: 'Close banner' });

    // Verify banner appears immediately, i.e. no enter animation
    await expect(banner).toBeVisible();

    await userEvent.click(closeButton);
    await waitFor(() => expect(banner).not.toBeVisible(), { timeout: 2000 });

    await userEvent.click(openButton);
    await waitFor(() => expect(banner).toBeVisible(), { timeout: 2000 });
  },
};
