import { MatIconModule } from '@angular/material/icon';
import { AnyLink } from '@atlasng/common';
import { TextLink } from '@atlasng/design-system/text-link';
import { type Meta, type StoryObj } from '@storybook/angular';
import { ProfileCard } from './profile-card';
import { SocialMediaButton } from '@atlasng/design-system/buttons/social-media';

const meta: Meta<ProfileCard> = {
  component: ProfileCard,
  title: 'Labs/Profile Card',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=1720-14192',
    },
  },
  args: {
    pictureUrl: 'assets/placeholder.png',
    name: 'Firstname Lastname',
    description: 'Occupation, Company',
    centerContent: false,
  },
};
export default meta;
type Story = StoryObj<ProfileCard>;

export const Default: Story = {
  name: 'Action Button',
  render: (args) => ({
    props: args,
    moduleMetadata: {
      imports: [AnyLink, MatIconModule, TextLink],
    },
    styles: [
      `.action-link {
        margin-top: .5rem;
      }`,
    ],
    template: `
      <ang-profile-card
        [pictureUrl]="pictureUrl"
        [name]="name"
        [description]="description"
        [centerContent]="centerContent"
      >
        <a angTextLink angAnyLink="www.example.com" class="action-link">
          Action <mat-icon fontIcon="arrow_right_alt"/>
        </a>

      </ang-profile-card>
    `,
  }),
};

export const SocialIcons: Story = {
  args: {
    centerContent: true,
  },
  render: (args) => ({
    props: args,
    moduleMetadata: {
      imports: [AnyLink, SocialMediaButton],
    },
    styles: [
      `.social-media-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;

          ang-social-media-button {
            height: 2.5rem;
          }
        }
      }`,
    ],
    template: `
      <ang-profile-card
        [pictureUrl]="pictureUrl"
        [name]="name"
        [description]="description"
        [centerContent]="centerContent"
      >
        <div class="social-media-actions">
          <ang-social-media-button id="linkedin"></ang-social-media-button>
          <ang-social-media-button id="github"></ang-social-media-button>
          <ang-social-media-button id="youtube"></ang-social-media-button>
          <ang-social-media-button id="instagram"></ang-social-media-button>
        </div>
      </ang-profile-card>
    `,
  }),
};
