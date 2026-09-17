import { Type } from '@angular/core';
import {
  CheckboxCellDefinition,
  CheckboxHeaderCellDefinition,
  CodeCellDefinition,
  LinkCellDefinition,
  NumberCellDefinition,
  TextCellDefinition,
  TextHeaderCellDefinition,
} from '@atlasng/design-system/table/columns';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { Row, Table, TableColumn } from '../index';

/** Row displayed in table stories. */
interface Person extends Row {
  name: string;
  role: string;
  score: number;
  profile: string;
  source: string;
}

/** Representative story data. */
const ROWS: Person[] = [
  { name: 'Ada Lovelace', role: 'Mathematician', score: 1234.5, profile: '/people/ada', source: 'ada' },
  { name: 'Grace Hopper', role: 'Computer scientist', score: 942, profile: '/people/grace', source: 'grace' },
  { name: 'Katherine Johnson', role: 'Mathematician', score: 98, profile: '/people/katherine', source: 'katherine' },
  { name: 'Margaret Hamilton', role: 'Software engineer', score: 97, profile: '/people/margaret', source: 'margaret' },
];

/** Extended story data for demonstrating vertical scrolling. */
const MANY_ROWS: Person[] = Array.from({ length: 100 }, (_, index) => {
  const person = ROWS[index % ROWS.length];
  const rowNumber = index + 1;

  return {
    ...person,
    name: `${person.name} ${rowNumber}`,
    profile: `${person.profile}-${rowNumber}`,
    source: `${person.source}-${rowNumber}`,
  };
});

/** Default story columns. */
const COLUMNS: TableColumn<Person>[] = [
  {
    name: 'Name',
    prop: 'name',
    cellTemplate: TextCellDefinition,
    headerTemplate: TextHeaderCellDefinition,
    headerConfig: { align: 'start' },
  },
  {
    name: 'Role',
    prop: 'role',
    cellTemplate: TextCellDefinition,
    headerTemplate: TextHeaderCellDefinition,
    headerConfig: { align: 'start' },
  },
  {
    name: 'Score',
    prop: 'score',
    cellTemplate: NumberCellDefinition,
    headerTemplate: TextHeaderCellDefinition,
    headerConfig: { align: 'end' },
  },
  {
    name: 'Profile',
    prop: 'profile',
    cellTemplate: LinkCellDefinition,
    cellConfig: { labelFn: (row: Person) => `${row.name} profile` },
    headerTemplate: TextHeaderCellDefinition,
    headerConfig: { align: 'start' },
  },
  {
    name: 'Code',
    prop: 'source',
    cellTemplate: CodeCellDefinition,
    headerTemplate: TextHeaderCellDefinition,
    headerConfig: { align: 'start' },
  },
];

const meta: Meta<Table<Person>> = {
  title: 'Design System/Table',
  component: Table as Type<Table<Person>>,
  decorators: [
    moduleMetadata({
      imports: [Table],
    }),
  ],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/gQEMLugLjweDvbsNNUVffD/AtlasNG-Design-System-Repository?node-id=7791-64814',
    },
    layout: 'padded',
  },
  args: {
    appearance: 'striped',
    rows: ROWS,
    columns: COLUMNS,
  },
  argTypes: {
    appearance: {
      control: 'select',
      options: ['striped', 'grid', 'vertical-rules', 'none'],
    },
  },
  render: (args) => ({
    props: args,
    template: `<ang-table style="max-height: 320px;" ${argsToTemplate(args)} />`,
  }),
};

export default meta;
type Story = StoryObj<Table<Person>>;

/** Basic virtualized table. */
export const Default: Story = {};

/** Virtualized table with enough rows to demonstrate vertical scrolling. */
export const WithManyRows: Story = {
  args: {
    rows: MANY_ROWS,
  },
};

/** Table with an explicit Material checkbox selection column. */
export const WithSelection: Story = {
  args: {
    selectionType: 'checkbox',
    selected: [ROWS[0]],
    columns: [
      {
        name: 'Select',
        sortable: false,
        flexGrow: 0,
        width: 48,
        cellTemplate: CheckboxCellDefinition,
        headerTemplate: CheckboxHeaderCellDefinition,
      },
      ...COLUMNS,
    ],
  },
};

/** Table initialized with a descending score sort. */
export const WithSorting: Story = {
  args: {
    sorts: [{ prop: 'score', dir: 'desc' }],
  },
};

/** Sortable and static headers using reusable logical alignment configuration. */
export const WithHeaderAlignment: Story = {
  args: {
    columns: [
      {
        name: 'Start (sortable)',
        prop: 'name',
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'start' },
      },
      {
        name: 'Center (static)',
        prop: 'role',
        sortable: false,
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'center' },
      },
      {
        name: 'End (sortable)',
        prop: 'score',
        cellTemplate: NumberCellDefinition,
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'end' },
      },
    ],
  },
};

/** Link labels supplied by static, row-property, and computed configurations. */
export const WithLinkLabels: Story = {
  args: {
    columns: [
      {
        name: 'Static',
        prop: 'profile',
        cellTemplate: LinkCellDefinition,
        cellConfig: { label: 'View profile' },
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'start' },
      },
      {
        name: 'Property',
        prop: 'profile',
        cellTemplate: LinkCellDefinition,
        cellConfig: { labelProp: 'name' },
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'start' },
      },
      {
        name: 'Function',
        prop: 'profile',
        cellTemplate: LinkCellDefinition,
        cellConfig: { labelFn: (row: Person) => `Open ${row.name}` },
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'start' },
      },
    ],
  },
};

/** All supported appearance variants displayed together. */
export const Appearances: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: grid; gap: 32px;">
        @for (variant of ['striped', 'grid', 'vertical-rules', 'none']; track variant) {
          <section>
            <h2>{{ variant }}</h2>
            <div style="height: 260px;">
              <ang-table [appearance]="variant" [rows]="rows" [columns]="columns" />
            </div>
          </section>
        }
      </div>
    `,
  }),
};

/** Default and projected empty states displayed together. */
export const Empty: Story = {
  render: (args) => ({
    props: { ...args, rows: [] },
    template: `
      <div style="display: grid; gap: 32px;">
        <section>
          <h2>Default empty state</h2>
          <ang-table [rows]="rows" [columns]="columns" />
        </section>

        <section>
          <h2>Projected empty state</h2>
          <ang-table [rows]="rows" [columns]="columns">
            <p empty-content style="padding: 32px; text-align: center;">No archived people.</p>
          </ang-table>
        </section>
      </div>
    `,
  }),
};
