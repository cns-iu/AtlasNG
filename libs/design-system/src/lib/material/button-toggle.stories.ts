import { MatButtonToggleGroup, MatButtonToggleModule } from '@angular/material/button-toggle';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

/** Organs offered as toggle options. */
const ORGANS = ['Heart', 'Lungs', 'Kidney', 'Liver', 'Spleen'];

const meta: Meta<MatButtonToggleGroup> = {
  title: 'Material/Button Toggle',
  component: MatButtonToggleGroup,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=853-284',
    },
  },
  args: {
    appearance: 'standard',
    disabled: false,
    hideMultipleSelectionIndicator: false,
    hideSingleSelectionIndicator: false,
    multiple: false,
    value: 'Heart',
    vertical: false,
  },
  argTypes: {
    appearance: {
      control: 'select',
      description: 'Visual style of the toggles.',
      options: ['standard', 'legacy'],
    },
    disabled: {
      control: 'boolean',
      description: 'Whether every toggle in the group is disabled.',
    },
    hideMultipleSelectionIndicator: {
      control: 'boolean',
      description: 'Whether to hide the checkmark on selected toggles when multiple selection is on.',
    },
    hideSingleSelectionIndicator: {
      control: 'boolean',
      description: 'Whether to hide the checkmark on the selected toggle in single selection mode.',
    },
    multiple: {
      control: false,
      description:
        'Whether more than one toggle can be selected. Set when the group is created; see the Multiple story.',
    },
    value: {
      control: false,
      description: 'Value of the selected toggle, or an array of values when `multiple` is set.',
    },
    vertical: {
      control: 'boolean',
      description: 'Whether the toggles are stacked vertically.',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatButtonToggleModule],
    }),
  ],
  render: (args) => ({
    props: { ...args, organs: ORGANS },
    template: `<mat-button-toggle-group aria-label="Organ" ${argsToTemplate(args)}>
      @for (organ of organs; track organ) {
        <mat-button-toggle [value]="organ">{{ organ }}</mat-button-toggle>
      }
    </mat-button-toggle-group>`,
  }),
};

export default meta;
type Story = StoryObj<MatButtonToggleGroup>;

export const Default: Story = {};

export const Multiple: Story = {
  args: {
    multiple: true,
    value: ['Heart', 'Kidney'],
  },
};

export const Vertical: Story = {
  args: {
    vertical: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
