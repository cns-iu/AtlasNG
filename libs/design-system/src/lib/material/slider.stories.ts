import { MatSlider, MatSliderModule } from '@angular/material/slider';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

interface CustomizationControls {
  value?: number;
}

/** Gives the slider room to show its track. */
const SLIDER_STYLES = [`mat-slider { width: 18.75rem; }`];

const meta: Meta<MatSlider & CustomizationControls> = {
  title: 'Material/Slider',
  component: MatSlider,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=2135-245',
    },
  },
  args: {
    disabled: false,
    discrete: false,
    max: 100,
    min: 0,
    showTickMarks: false,
    step: 1,
    value: 50,
  },
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the slider is disabled.',
    },
    discrete: {
      control: 'boolean',
      description: 'Whether a value label shows above the thumb while it is dragged or focused.',
    },
    max: {
      control: 'number',
      description: 'Largest value the slider can have.',
    },
    min: {
      control: 'number',
      description: 'Smallest value the slider can have.',
    },
    showTickMarks: {
      control: 'boolean',
      description: 'Whether tick marks show at each step.',
    },
    step: {
      control: 'number',
      description: 'Amount the value changes with each step.',
    },
    value: {
      control: 'number',
      description: 'Value of the thumb.',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatSliderModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `<mat-slider ${argsToTemplate(args, { exclude: ['value'] })}>
      <input matSliderThumb aria-label="Value" [value]="value" />
    </mat-slider>`,
    styles: SLIDER_STYLES,
  }),
};

export default meta;
type Story = StoryObj<MatSlider & CustomizationControls>;

export const Default: Story = {};

export const Discrete: Story = {
  args: {
    discrete: true,
  },
};

export const TickMarks: Story = {
  args: {
    discrete: true,
    showTickMarks: true,
    step: 10,
  },
};

export const Range: Story = {
  render: (args) => ({
    props: args,
    template: `<mat-slider ${argsToTemplate(args, { exclude: ['value'] })}>
      <input matSliderStartThumb aria-label="Minimum" value="25" />
      <input matSliderEndThumb aria-label="Maximum" value="75" />
    </mat-slider>`,
    styles: SLIDER_STYLES,
  }),
  argTypes: {
    value: { table: { disable: true } },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
