import { MatIconModule } from '@angular/material/icon';
import { AnyLink } from '@atlasng/common';
import { TextLink } from '@atlasng/design-system/text-link';
import { type Meta, type StoryObj } from '@storybook/angular';
import { ProfileCard } from './profile-card';

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
    pictureUrl: 'assets/placeholder.svg',
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
        display: inline-flex;
        gap: 0.5rem;
        align-items: center;
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

// export const SocialIcons: Story = {
//   render: (args) => ({
//     props: args,
//     moduleMetadata: {
//       imports: [AnyLink, MatIconModule],
//     },
//     styles: [
//       `.social-media-actions {
//         display: flex;
//         gap: 0.5rem;
//         align-items: center;
//         color: vars.$on-tertiary-fixed;
//       }
//     }`,
//     ],
//     template: `
//       <ang-profile-card
//         [pictureUrl]="pictureUrl"
//         [name]="name"
//         [description]="description"
//         [centerContent]="centerContent"
//       >
//         <div class="social-media-actions">
//           <a mat-icon-button>
//             <mat-icon color="accent">mail</mat-icon>
//           </a>
//           <a mat-icon-button>
//             <mat-icon color="accent">person</mat-icon>
//           </a>
//           <a mat-icon-button>
//             <mat-icon svgIcon="social:linkedin" color="accent"></mat-icon>
//           </a>
//           <a mat-icon-button>
//             <mat-icon svgIcon="social:github" color="accent"></mat-icon>
//           </a>
//         </div>
//       </ang-profile-card>
//     `,
//   }),
// };
