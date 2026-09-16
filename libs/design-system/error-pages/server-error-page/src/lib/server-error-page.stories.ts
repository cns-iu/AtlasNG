import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ServerErrorPage, ServerErrorPageTitle } from './server-error-page';

const meta: Meta = {
  component: ServerErrorPage,
  title: 'Design System / Error Pages / Server Error Page',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=3292-4471',
    },
    layout: 'fullscreen',
  },
  decorators: [
    moduleMetadata({
      imports: [ServerErrorPageTitle],
    }),
  ],
  args: {
    reportIssueLink: 'https://www.example.com',
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="container">
        <ang-server-error-page [reportIssueLink]="reportIssueLink" />
      </div>
    `,
    styles: [
      `
        .container {
          height: 100vh;
        }
      `,
    ],
  }),
};

export const CustomTitle: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="container">
        <ang-server-error-page [reportIssueLink]="reportIssueLink">
          <ang-server-error-page-title>Custom title</ang-server-error-page-title>
        </ang-server-error-page>
      </div>
    `,
    styles: [
      `
        .container {
          height: 100vh;
        }
      `,
    ],
  }),
};
