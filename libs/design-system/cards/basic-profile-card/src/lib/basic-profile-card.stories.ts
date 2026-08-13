import { argsToTemplate, type Meta, type StoryObj } from '@storybook/angular';
import { BasicProfileCard } from './basic-profile-card';

const meta: Meta<BasicProfileCard> = {
  component: BasicProfileCard,
  title: 'Design System/Cards/Basic Profile Card',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=8418-337&t=L0MFt2ccOP54wG3r-4',
    },
  },
  args: {
    image: 'assets/profile-placeholder.png',
    name: 'Firstname Lastname',
    description: [
      'Occupation/Employer detail 1 that wraps as needed',
      'Occupation/Employer detail 2 that wraps as needed',
      'Occupation/Employer detail 3 that wraps as needed',
    ],
    link: 'https://www.example.com',
  },
};
export default meta;
type Story = StoryObj<BasicProfileCard>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-basic-profile-card ${argsToTemplate(args)} />
    `,
  }),
};
