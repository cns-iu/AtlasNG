import { MatProgressBar, MatProgressBarModule } from '@angular/material/progress-bar';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

const meta: Meta<MatProgressBar> = {
  title: 'Material/Progress Bar',
  component: MatProgressBar,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=1209-424',
    },
  },
  args: {
    bufferValue: 0,
    mode: 'determinate',
    value: 40,
  },
  argTypes: {
    bufferValue: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Buffer value, from 0 to 100. Only applies in buffer mode.',
    },
    mode: {
      control: 'select',
      description:
        'Use determinate when the progress is known and indeterminate when it is not. Buffer also shows loaded data, and query shows a request before loading starts.',
      options: ['determinate', 'indeterminate', 'buffer', 'query'],
    },
    value: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Progress value, from 0 to 100. Applies in determinate and buffer modes.',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatProgressBarModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `<mat-progress-bar aria-label="Loading" ${argsToTemplate(args)} />`,
  }),
};

export default meta;
type Story = StoryObj<MatProgressBar>;

export const Determinate: Story = {};

export const Indeterminate: Story = {
  args: {
    mode: 'indeterminate',
  },
};

export const Buffer: Story = {
  args: {
    bufferValue: 70,
    mode: 'buffer',
  },
};

export const Query: Story = {
  args: {
    mode: 'query',
  },
};
