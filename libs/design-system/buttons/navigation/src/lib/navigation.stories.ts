import { Meta, StoryObj } from '@storybook/angular';
import { Navigation } from './navigation';

const meta: Meta<Navigation> = {
  component: Navigation,
  title: 'Design System/Buttons/Navigation',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=7493-48830',
    },
  },
  args: {
    link: 'https://example.com',
  },
  render: (args) => ({
    props: args,
    template: `<ang-navigation [link]="link">Label</ang-navigation>`,
  }),
};

export default meta;
type Story = StoryObj<Navigation>;

export const Default: Story = {};
