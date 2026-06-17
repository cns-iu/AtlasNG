import { Meta, StoryObj } from '@storybook/angular';
import { Table } from './table';

const meta: Meta<Table> = {
  component: Table,
  title: 'Labs/Table',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=2674-376',
    },
  },
  args: {
    enableSort: true,
    verticalDividers: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['alternating', 'divider', 'basic'],
    },
    enableSort: {
      control: 'boolean',
    },
    verticalDividers: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<Table>;

export const Default: Story = {};
