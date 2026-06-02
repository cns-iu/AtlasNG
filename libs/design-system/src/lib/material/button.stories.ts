import { CommonModule } from '@angular/common';
import { MatButtonAppearance, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

interface CustomizationArgs {
  appearance: MatButtonAppearance;
  icon?: string;
  disabled: boolean;
}

const meta: Meta<CustomizationArgs> = {
  title: 'Material/Buttons',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=5-842',
    },
  },
  args: {
    appearance: 'text',
    disabled: false,
  },
  argTypes: {
    appearance: {
      control: { type: 'select' },
      description: 'The appearance of the button.',
      options: ['text', 'filled', 'outlined', 'tonal'],
    },
    icon: {
      control: { type: 'text' },
      description: 'The icon to display in the button.',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled.',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [CommonModule, MatButtonModule, MatIconModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <button [matButton]="appearance" [disabled]="disabled">
        <mat-icon [fontIcon]="icon" [style.display]="icon ? null : 'none'" />
        {{ appearance | titlecase }}
      </button>
    `,
  }),
};

export default meta;
type Story = StoryObj<CustomizationArgs>;

export const Text: Story = {};

export const TextWithIcon: Story = {
  args: {
    icon: 'download',
  },
};

export const Filled: Story = {
  args: {
    appearance: 'filled',
  },
};

export const Outlined: Story = {
  args: {
    appearance: 'outlined',
  },
};

export const Tonal: Story = {
  args: {
    appearance: 'tonal',
  },
};
