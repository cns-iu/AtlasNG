import { Meta, StoryObj } from '@storybook/angular';
import { Table, TableColumn, TableRow } from './table';

const rows: TableRow[] = [
  {
    name: { label: 'Hydrogen', link: 'https://en.wikipedia.org/wiki/Hydrogen' },
    weight: 1.0079,
    symbol: 'H',
  },
  {
    name: { label: 'Helium', link: 'https://en.wikipedia.org/wiki/Helium' },
    weight: 4.0026,
    symbol: 'He',
  },
  {
    name: { label: 'Lithium', link: 'https://en.wikipedia.org/wiki/Lithium' },
    weight: 6.941,
    symbol: 'Li',
  },
  {
    name: { label: 'Beryllium', link: 'https://en.wikipedia.org/wiki/Beryllium' },
    weight: 9.0122,
    symbol: 'Be',
  },
  { name: { label: 'Boron', link: 'https://en.wikipedia.org/wiki/Boron' }, weight: 10.811, symbol: 'B' },
  {
    name: { label: 'Carbon', link: 'https://en.wikipedia.org/wiki/Carbon' },
    weight: 12.0107,
    symbol: 'C',
  },
  {
    name: { label: 'Nitrogen', link: 'https://en.wikipedia.org/wiki/Nitrogen' },
    weight: 14.0067,
    symbol: 'N',
  },
  {
    name: { label: 'Oxygen', link: 'https://en.wikipedia.org/wiki/Oxygen' },
    weight: 15.9994,
    symbol: 'O',
  },
  {
    name: { label: 'Fluorine', link: 'https://en.wikipedia.org/wiki/Fluorine' },
    weight: 18.9984,
    symbol: 'F',
  },
  { name: { label: 'Neon', link: 'https://en.wikipedia.org/wiki/Neon' }, weight: 20.1797, symbol: 'Ne' },
  {
    name: { label: 'Sodium', link: 'https://en.wikipedia.org/wiki/Sodium' },
    weight: 22.9897,
    symbol: 'Na',
  },
  {
    name: { label: 'Magnesium', link: 'https://en.wikipedia.org/wiki/Magnesium' },
    weight: 24.305,
    symbol: 'Mg',
  },
  {
    name: { label: 'Aluminum', link: ' https://en.wikipedia.org/wiki/Aluminum' },
    weight: 26.9815,
    symbol: 'Al',
  },
  {
    name: { label: 'Silicon', link: 'https://en.wikipedia.org/wiki/Silicon' },
    weight: 28.0855,
    symbol: 'Si',
  },
  {
    name: { label: 'Phosphorus', link: 'https://en.wikipedia.org/wiki/Phosphorus' },
    weight: 30.9738,
    symbol: 'P',
  },
  {
    name: { label: 'Sulfur', link: 'https://en.wikipedia.org/wiki/Sulfur' },
    weight: 32.065,
    symbol: 'S',
  },
  {
    name: { label: 'Chlorine', link: 'https://en.wikipedia.org/wiki/Chlorine' },
    weight: 35.453,
    symbol: 'Cl',
  },
  {
    name: { label: 'Argon', link: 'https://en.wikipedia.org/wiki/Argon' },
    weight: 39.948,
    symbol: 'Ar',
  },
  {
    name: { label: 'Potassium', link: 'https://en.wikipedia.org/wiki/Potassium' },
    weight: 39.0983,
    symbol: 'K',
  },
  {
    name: { label: 'Calcium', link: 'https://en.wikipedia.org/wiki/Calcium' },
    weight: 40.078,
    symbol: 'Ca',
  },
];

const columns: TableColumn[] = [
  {
    column: 'name',
    label: 'Name',
  },
  {
    column: 'symbol',
    label: 'Symbol',
  },
  {
    column: 'weight',
    label: 'Weight',
    align: 'right',
  },
];

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
    rows: rows,
    columns: columns,
    enableSort: true,
    stickyHeader: true,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['alternating', 'divider', 'basic'],
    },
    enableSort: {
      control: 'boolean',
    },
    stickyHeader: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<Table>;

export const Default: Story = {};
