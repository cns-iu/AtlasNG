import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { RichTooltipDirective } from './rich-tooltip.directive';
import { RichTooltipModule } from './rich-tooltip.module';

const meta: Meta<RichTooltipDirective> = {
  title: 'Design System/Rich Tooltip',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=52-100',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatIconModule, MatButtonModule, RichTooltipModule],
    }),
  ],
};
export default meta;
type Story = StoryObj<RichTooltipDirective>;

export const Simple: Story = {
  name: 'Simple Tooltip',
  args: {
    tagline: 'Title',
    description: 'Supporting line text lorem ipsum dolor sit amet, consectetur',
    actionText: 'Action',
    actionClick: () => {},
  },
  argTypes: {
    actionClick: { type: 'function', control: false },
  },
  render: (args) => ({
    props: args,
    styles: [],
    template: `
        <button mat-icon-button
        angRichTooltip
        angRichTooltipTagline="${args.tagline}"
        angRichTooltipDescription="${args.description}"
        (angRichTooltipActionClick)="actionClick()">
          <mat-icon>info</mat-icon>
        </button>
      `,
  }),
};

export const SimpleWithAction: Story = {
  name: 'Simple Tooltip with Action',
  args: {
    tagline: 'Title',
    description: 'Supporting line text lorem ipsum dolor sit amet, consectetur',
    actionText: 'Action',
    actionClick: () => {},
  },
  argTypes: {
    actionClick: { type: 'function', control: false },
  },
  render: (args) => ({
    props: args,
    styles: [],
    template: `
        <button mat-icon-button
        angRichTooltip
        angRichTooltipTagline="${args.tagline}"
        angRichTooltipDescription="${args.description}"
        angRichTooltipActionText="${args.actionText}"
        (angRichTooltipActionClick)="actionClick()">
          <mat-icon>info</mat-icon>
        </button>
      `,
  }),
};

export const AdvancedTooltip: Story = {
  name: 'Advanced Tooltip with Custom Content',
  render: (args) => ({
    props: args,
    template: `
        <ang-rich-tooltip-container #content class="container">
          <ang-rich-tooltip-tagline>
            Hello Developer!
          </ang-rich-tooltip-tagline>
          <ang-rich-tooltip-content>
            This is some brand new component.
          </ang-rich-tooltip-content>
          <ang-rich-tooltip-actions>
            <button mat-button color="accent" angRichTooltipClose>Close</button>
            <button mat-button color="accent">Do Nothing</button>
          </ang-rich-tooltip-actions>
        </ang-rich-tooltip-container>
        <button mat-icon-button [angRichTooltip]="content">
            <mat-icon>info</mat-icon>
        </button>
      `,
  }),
};
