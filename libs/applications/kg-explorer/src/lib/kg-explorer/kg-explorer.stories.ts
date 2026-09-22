import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { KgExplorer } from './kg-explorer';

const meta: Meta<KgExplorer> = {
  component: KgExplorer,
  title: 'Applications/KG Explorer',
};

export default meta;

type Story = StoryObj<KgExplorer>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('KG Explorer works!')).toBeVisible();
  },
};
