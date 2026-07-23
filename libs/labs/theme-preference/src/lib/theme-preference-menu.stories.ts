import { MatToolbarModule } from '@angular/material/toolbar';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { ThemePreferenceMenu } from './theme-preference-menu';

const meta: Meta<ThemePreferenceMenu> = {
  title: 'Labs/Theme Preference/Menu',
  component: ThemePreferenceMenu,
  args: {
    preference: 'system',
    disabled: false,
    ariaLabel: 'Choose theme preference',
    tooltip: 'Theme settings',
    xPosition: 'before',
    yPosition: 'below',
    overlapTrigger: false,
  },
  argTypes: {
    preference: {
      control: 'select',
      options: ['light', 'dark', 'system'],
      description: 'Selected theme preference.',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the menu trigger is disabled.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible name for the menu trigger.',
    },
    tooltip: {
      control: 'text',
      description: 'Tooltip displayed for the menu trigger.',
    },
    xPosition: {
      control: 'select',
      options: ['before', 'after'],
      description: 'Preferred horizontal menu position.',
    },
    yPosition: {
      control: 'select',
      options: ['above', 'below'],
      description: 'Preferred vertical menu position.',
    },
    overlapTrigger: {
      control: 'boolean',
      description: 'Whether the menu overlaps its trigger.',
    },
  },
  render: (args) => ({
    props: args,
    template: `<ang-theme-preference-menu ${argsToTemplate(args)} />`,
  }),
};

export default meta;
type Story = StoryObj<ThemePreferenceMenu>;

export const Default: Story = {};

export const Light: Story = {
  args: { preference: 'light' },
};

export const Dark: Story = {
  args: { preference: 'dark' },
};

export const HeaderPlacement: Story = {
  decorators: [
    moduleMetadata({
      imports: [MatToolbarModule],
    }),
  ],
  render: (args) => ({
    props: args,
    styles: ['.story-title { flex: 1 1 auto; }'],
    template: `
      <mat-toolbar>
        <span class="story-title">Application</span>
        <ang-theme-preference-menu ${argsToTemplate(args)} />
      </mat-toolbar>
    `,
  }),
};

export const Disabled: Story = {
  args: { disabled: true },
};
