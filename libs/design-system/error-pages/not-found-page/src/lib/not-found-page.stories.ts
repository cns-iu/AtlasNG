import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { NotFoundPage, NotFoundPageTitle } from './not-found-page';

const meta: Meta = {
  component: NotFoundPage,
  title: 'Design System / Error Pages / Not Found Page',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=3287-71',
    },
    layout: 'fullscreen',
  },
  decorators: [
    moduleMetadata({
      imports: [NotFoundPageTitle],
    }),
  ],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div class="container">
        <ang-not-found-page/>
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
  render: () => ({
    template: `
      <div class="container">
      <ang-not-found-page>
        <ang-not-found-page-title>Custom title</ang-not-found-page-title>
      </ang-not-found-page>
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
