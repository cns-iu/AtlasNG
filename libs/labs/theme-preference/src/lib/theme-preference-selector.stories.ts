import { Meta, StoryObj } from '@storybook/angular';
import { ThemePreferenceSelector } from './theme-preference-selector';

const meta: Meta<ThemePreferenceSelector> = {
  title: 'Labs/Theme Preference/Selector',
  component: ThemePreferenceSelector,
  args: {
    preference: 'system',
    disabled: false,
    ariaLabel: 'Theme preference',
  },
  argTypes: {
    preference: {
      control: 'select',
      options: ['light', 'dark', 'system'],
      description: 'Selected theme preference.',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether users can change the preference.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible name for the preference group.',
    },
  },
};

export default meta;
type Story = StoryObj<ThemePreferenceSelector>;

export const Default: Story = {};

export const Light: Story = {
  args: { preference: 'light' },
};

export const Dark: Story = {
  args: { preference: 'dark' },
};

export const Disabled: Story = {
  args: { disabled: true },
};
