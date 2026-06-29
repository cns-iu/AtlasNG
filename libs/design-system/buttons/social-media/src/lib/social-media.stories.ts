import { Meta, StoryObj } from '@storybook/angular';
import {
  DEFAULT_SOCIAL_MEDIA_BUTTON_DEFS,
  SocialMediaButton,
  SocialMediaButtonDef,
  provideSocialMediaButtons,
} from './social-media';

const IDS = DEFAULT_SOCIAL_MEDIA_BUTTON_DEFS.map((def) => def.id);

// Custom definitions example
const customDefs: SocialMediaButtonDef[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/aaa',
    classes: ['linkedin'],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    url: 'https://www.youtube.com/bbb',
    classes: ['youtube'],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/ccc',
    classes: ['instagram'],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    url: 'https://www.facebook.com/ddd',
    classes: ['facebook'],
  },
  {
    id: 'github',
    label: 'GitHub',
    url: 'https://github.com/eee',
    classes: ['github'],
  },
  {
    id: 'bluesky',
    label: 'Bluesky',
    url: 'https://bsky.app/fff',
    classes: ['bluesky'],
  },
  {
    id: 'x',
    label: 'X (formerly Twitter)',
    url: 'https://twitter.com/ggg',
    classes: ['x'],
  },
];

const meta: Meta<SocialMediaButton> = {
  component: SocialMediaButton,
  title: 'Design System/Buttons/Social Media Button',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=2470-413',
    },
  },
};

export default meta;
type Story = StoryObj<SocialMediaButton>;

export const Default: Story = {
  args: {
    id: IDS[0],
  },
  argTypes: {
    id: {
      control: 'select',
      options: IDS,
    },
  },
};

export const CustomUrl: Story = {
  render: (args) => ({
    component: SocialMediaButton,
    providers: [provideSocialMediaButtons(customDefs)],
    props: args,
  }),
  args: { def: customDefs[2] },
};
