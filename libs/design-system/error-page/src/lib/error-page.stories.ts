import { MatButtonModule } from '@angular/material/button';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ErrorPage, ErrorPageAction, ErrorPageDescription, ErrorPageTitle } from './error-page';
import { NotFoundPage } from './not-found-page/not-found-page';
import { ServerErrorPage } from './server-error-page/server-error-page';

const meta: Meta = {
  component: ErrorPage,
  title: 'Design System/Error Page',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=3287-71',
    },
    layout: 'fullscreen',
  },
  decorators: [
    moduleMetadata({
      imports: [ErrorPageTitle, ErrorPageDescription, ErrorPageAction, MatButtonModule, NotFoundPage, ServerErrorPage],
    }),
  ],
};

export default meta;
type Story = StoryObj;

export const CustomContent: Story = {
  render: () => ({
    template: `
      <ang-error-page>
        <ang-error-page-title>Custom title</ang-error-page-title>
        <ang-error-page-description>Custom description</ang-error-page-description>
        <a angErrorPageAction matButton="filled">Custom action 1</a>
        <a angErrorPageAction matButton>Custom action 2</a>
      </ang-error-page>
    `,
  }),
};

export const NotFound: Story = {
  render: () => ({
    template: `
      <ang-not-found-page />
    `,
  }),
};

export const ServerError: Story = {
  render: () => ({
    template: `
      <ang-server-error-page reportIssueLink="https://example.com/report-issue" />
    `,
  }),
};
