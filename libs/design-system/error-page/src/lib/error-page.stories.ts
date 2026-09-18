import { MatButtonModule } from '@angular/material/button';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ErrorPage, ErrorPageActions, ErrorPageDescription, ErrorPageTitle } from './error-page';
import { NotFoundPage } from './not-found-page/not-found-page';
import { ServerErrorPage } from './server-error-page/server-error-page';

const meta: Meta = {
  component: ErrorPage,
  title: 'Design System / Error Page',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=3287-71',
    },
    layout: 'fullscreen',
  },
  decorators: [
    moduleMetadata({
      imports: [ErrorPageTitle, ErrorPageDescription, ErrorPageActions, MatButtonModule, NotFoundPage, ServerErrorPage],
    }),
  ],
};

export default meta;
type Story = StoryObj;

export const CustomContent: Story = {
  render: () => ({
    template: `
      <div class="container">
        <ang-error-page>
          <ang-error-page-title>Custom title</ang-error-page-title>
          <ang-error-page-description>Custom description</ang-error-page-description>
          <ang-error-page-actions>
            <a matButton="filled">Custom action 1</a>
            <a matButton>Custom action 2</a>
          </ang-error-page-actions>
        </ang-error-page>
      </div>
    `,
    styles: [`.container { height: 100vh; }`],
  }),
};

export const NotFound: Story = {
  render: () => ({
    template: `
      <div class="container">
        <ang-not-found-page/>
      </div>
    `,
    styles: [`.container { height: 100vh; }`],
  }),
};

export const ServerError: Story = {
  render: () => ({
    template: `
      <div class="container">
        <ang-server-error-page reportIssueLink="https://example.com/report-issue" />
      </div>
    `,
    styles: [`.container { height: 100vh; }`],
  }),
};
