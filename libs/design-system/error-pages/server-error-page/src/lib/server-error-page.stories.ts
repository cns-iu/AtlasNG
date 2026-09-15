import { type Meta, type StoryObj } from '@storybook/angular';
import { ServerErrorPage } from './server-error-page';

const meta: Meta<ServerErrorPage> = {
  component: ServerErrorPage,
  title: 'Design System / Error Pages / Server Error Page',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=3292-4471',
    },
    layout: 'fullscreen',
  },
  args: {
    reportIssueLink: 'https://www.example.com',
  },
};
export default meta;

type Story = StoryObj<ServerErrorPage>;

export const Default: Story = {};
