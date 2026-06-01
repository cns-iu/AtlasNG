import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TrackClick } from '@atlasng/analytics';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

const STYLES = [
  `button {
    --mat-button-text-label-text-color: var(--mat-sys-on-primary-container);
    --mat-button-text-state-layer-color: var(--mat-sys-on-primary-container);
    --mat-button-outlined-label-text-color: var(--mat-sys-on-surface-variant);
    --mat-button-outlined-state-layer-color: var(--mat-sys-on-surface-variant);
    --mat-button-outlined-ripple-color: color-mix(in srgb, var(--mat-sys-on-surface-variant) calc(var(--mat-sys-pressed-state-layer-opacity) * 100%), transparent)
  }`,
];

const meta: Meta = {
  title: 'Design System/Buttons/Standard Buttons',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=5-842',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatButtonModule, MatIconModule, TrackClick],
    }),
  ],
};

export default meta;
type Story = StoryObj;

export const Text: Story = {
  render: () => ({
    template: `
      <button matButton angTrackClick>Text</button>
    `,
    styles: STYLES,
  }),
};

export const TextWithIcon: Story = {
  render: () => ({
    template: `
      <button matButton angTrackClick>
        <mat-icon fontIcon="download" />
        Text
      </button>
    `,
    styles: STYLES,
  }),
};

export const Filled: Story = {
  render: () => ({
    template: `
      <button matButton="filled" angTrackClick>Filled</button>
    `,
    styles: STYLES,
  }),
};

export const Outlined: Story = {
  render: () => ({
    template: `
      <button matButton="outlined" angTrackClick>Outlined</button>
    `,
    styles: STYLES,
  }),
};

export const Tonal: Story = {
  render: () => ({
    template: `
      <button matButton="tonal" angTrackClick>Tonal</button>
    `,
    styles: STYLES,
  }),
};
