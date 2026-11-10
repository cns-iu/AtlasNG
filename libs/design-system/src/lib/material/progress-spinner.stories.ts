import { MatProgressSpinner, MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

const meta: Meta<MatProgressSpinner> = {
  title: 'Material/Progress Spinner',
  component: MatProgressSpinner,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=3173-10',
    },
  },
  args: {
    diameter: 100,
    mode: 'indeterminate',
    value: 40,
  },
  argTypes: {
    diameter: {
      control: 'number',
      description: 'Diameter of the spinner in pixels. The stroke width defaults to a tenth of it.',
    },
    mode: {
      control: 'select',
      description: 'Use determinate when the progress is known and indeterminate when it is not.',
      options: ['determinate', 'indeterminate'],
    },
    value: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Progress value, from 0 to 100. Only applies in determinate mode.',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatProgressSpinnerModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `<mat-progress-spinner aria-label="Loading" ${argsToTemplate(args)} />`,
  }),
};

export default meta;
type Story = StoryObj<MatProgressSpinner>;

export const Indeterminate: Story = {};

export const Determinate: Story = {
  args: {
    mode: 'determinate',
  },
};
