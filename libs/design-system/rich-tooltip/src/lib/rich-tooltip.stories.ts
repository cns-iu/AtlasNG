import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { RichTooltip, RichTooltipAction, RichTooltipContent, RichTooltipTagline } from './rich-tooltip';
import { RichTooltipClose } from './rich-tooltip-close';
import { RichTooltipTrigger } from './rich-tooltip-trigger';

/** Story args: the simple variant inputs and outputs of the panel. */
type RichTooltipArgs = {
  tagline?: string;
  description?: string;
  actionText?: string;
  actionClick: () => void;
};

const meta: Meta<RichTooltipArgs> = {
  title: 'Design System/Rich Tooltip',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=52-100',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [
        MatButtonModule,
        MatIconModule,
        RichTooltip,
        RichTooltipTagline,
        RichTooltipContent,
        RichTooltipAction,
        RichTooltipClose,
        RichTooltipTrigger,
      ],
    }),
  ],
  args: {
    tagline: 'Title',
    description: 'Supporting line text lorem ipsum dolor sit amet, consectetur',
    actionClick: fn(),
  },
  argTypes: {
    tagline: { control: 'text', description: 'Title of the simple variant.' },
    description: { control: 'text', description: 'Supporting text of the simple variant.' },
    actionText: { control: 'text', description: 'Label of the action button. The button is hidden when empty.' },
    actionClick: { control: false, description: 'Emits when the action button is clicked.' },
  },
  render: (args) => ({
    props: args,
    template: `
      <ang-rich-tooltip
        #tip
        [tagline]="tagline"
        [description]="description"
        [actionText]="actionText"
        (actionClick)="actionClick()"
      />
      <button matIconButton aria-label="Show more information" [angRichTooltipTriggerFor]="tip">
        <mat-icon>info</mat-icon>
      </button>
    `,
  }),
};
export default meta;
type Story = StoryObj<RichTooltipArgs>;

/** A rich tooltip with a title and supporting text. */
export const Simple: Story = {};

/** A rich tooltip with a single action button. */
export const SimpleWithAction: Story = {
  name: 'Simple with action',
  args: {
    actionText: 'Action',
  },
};

/** Custom content with a close button and an additional action. */
export const CustomContent: Story = {
  name: 'Custom content',
  argTypes: {
    tagline: { table: { disable: true } },
    description: { table: { disable: true } },
    actionText: { table: { disable: true } },
  },
  render: (args) => ({
    props: args,
    template: `
      <ang-rich-tooltip #tip>
        <ang-rich-tooltip-tagline>Hello developer!</ang-rich-tooltip-tagline>
        <ang-rich-tooltip-content>
          Rich tooltips can hold custom content, a close button, and any number of actions.
        </ang-rich-tooltip-content>
        <button matButton angRichTooltipAction angRichTooltipClose>Close</button>
        <button matButton angRichTooltipAction (click)="actionClick()">Learn more</button>
      </ang-rich-tooltip>
      <button matIconButton aria-label="Show more information" [angRichTooltipTriggerFor]="tip">
        <mat-icon>info</mat-icon>
      </button>
    `,
  }),
};
