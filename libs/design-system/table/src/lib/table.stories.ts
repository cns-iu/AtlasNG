import { Type } from '@angular/core';
import {
  CheckboxCellDefinition,
  CheckboxHeaderCellDefinition,
  CodeCellDefinition,
  LinkCellDefinition,
  NumberCellDefinition,
  NumberSummaryCellDefinition,
  TextCellDefinition,
  TextHeaderCellDefinition,
  type NumberSummaryCellConfig,
} from '@atlasng/design-system/table/columns';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { Row, Table, TableColumn, TableSummaryPosition } from '../index';

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
    minWidth: 200,
    cellTemplate: TextCellDefinition,
    headerTemplate: TextHeaderCellDefinition,
    headerConfig: { align: 'start' },
  },
  {
    name: 'Role',
    prop: 'role',
    minWidth: 200,
    cellTemplate: TextCellDefinition,
    headerTemplate: TextHeaderCellDefinition,
    headerConfig: { align: 'start' },
  },
  {
    name: 'Score',
    prop: 'score',
    minWidth: 120,
    cellTemplate: NumberCellDefinition,
    headerTemplate: TextHeaderCellDefinition,
    headerConfig: { align: 'end' },
  },
  {
    name: 'Profile',
    prop: 'profile',
    minWidth: 250,
    cellTemplate: LinkCellDefinition,
    cellConfig: { labelFn: (row: Person) => `${row.name} profile` },
    headerTemplate: TextHeaderCellDefinition,
    headerConfig: { align: 'start' },
  },
  {
    name: 'Code',
    prop: 'source',
    minWidth: 200,
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

/** Frozen left and right columns that stay in place while the center columns scroll horizontally. */
export const WithFrozenColumns: Story = {
  args: {
    rows: MANY_ROWS,
    columns: COLUMNS.map((column, index, columns) => ({
      ...column,
      frozenLeft: index === 0,
      frozenRight: index === columns.length - 1,
      minWidth: 320,
    })),
  },
  render: (args) => ({
    props: args,
    template: `<ang-table style="max-height: 320px; max-width: 800px;" ${argsToTemplate(args)} />`,
  }),
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

/** Sortable and static headers with matching cells, using reusable logical alignment configuration. */
export const WithHeaderAlignment: Story = {
  args: {
    columns: [
      {
        name: 'Start (sortable)',
        prop: 'name',
        minWidth: 200,
        cellTemplate: TextCellDefinition,
        cellConfig: { align: 'start' },
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'start' },
      },
      {
        name: 'Center (static)',
        prop: 'role',
        sortable: false,
        minWidth: 200,
        cellTemplate: TextCellDefinition,
        cellConfig: { align: 'center' },
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'center' },
      },
      {
        name: 'End (sortable)',
        prop: 'score',
        minWidth: 120,
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
        minWidth: 200,
        cellTemplate: LinkCellDefinition,
        cellConfig: { label: 'View profile' },
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'start' },
      },
      {
        name: 'Property',
        prop: 'profile',
        minWidth: 200,
        cellTemplate: LinkCellDefinition,
        cellConfig: { labelProp: 'name' },
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'start' },
      },
      {
        name: 'Function',
        prop: 'profile',
        minWidth: 200,
        cellTemplate: LinkCellDefinition,
        cellConfig: { labelFn: (row: Person) => `Open ${row.name}` },
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'start' },
      },
    ],
  },
};

/** Summary row computed with default, custom, and disabled summary functions. */
export const WithSummaryRow: Story = {
  args: {
    summaryRow: true,
    summaryPosition: 'bottom',
    columns: [
      {
        name: 'Name',
        prop: 'name',
        minWidth: 200,
        cellTemplate: TextCellDefinition,
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'start' },
        summaryFunc: (cells: string[]) => `${cells.length} people`,
      },
      {
        name: 'Role',
        prop: 'role',
        minWidth: 200,
        cellTemplate: TextCellDefinition,
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'start' },
        summaryFunc: null,
      },
      {
        name: 'Score',
        prop: 'score',
        minWidth: 120,
        cellTemplate: NumberCellDefinition,
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'end' },
        summaryTemplate: NumberSummaryCellDefinition,
      },
    ],
  },
  argTypes: {
    summaryPosition: {
      control: 'inline-radio',
      options: ['top', 'bottom'],
    },
  },
};

/** Row with a deliberately mixed value used to demonstrate number summary configuration. */
interface Measurement extends Row {
  kind: string;
  value: unknown;
}

/** One row for each kind of value the number summary distinguishes. */
const MEASUREMENTS: Measurement[] = [
  { kind: 'Number', value: 1200 },
  { kind: 'Number', value: 34.5 },
  { kind: 'Numeric string', value: '100' },
  { kind: 'Text', value: 'n/a' },
  { kind: 'Infinity', value: Infinity },
  { kind: 'NaN', value: NaN },
  { kind: 'Null', value: null },
  { kind: 'Empty string', value: '' },
];

/** Controls exposed by the number summary configuration story. */
type SummaryConfigArgs = Required<NumberSummaryCellConfig> & { summaryPosition: TableSummaryPosition };

/** Number summary over mixed values, with controls for coercion and non-finite handling. */
export const WithSummaryConfig: StoryObj<SummaryConfigArgs> = {
  args: {
    coerce: false,
    nonFinite: 'skip',
    summaryPosition: 'bottom',
  },
  argTypes: {
    coerce: { control: 'boolean' },
    nonFinite: { control: 'inline-radio', options: ['skip', 'include'] },
    summaryPosition: { control: 'inline-radio', options: ['top', 'bottom'] },
  },
  render: ({ coerce, nonFinite, summaryPosition }) => {
    const columns: TableColumn<Measurement>[] = [
      {
        name: 'Kind',
        prop: 'kind',
        minWidth: 200,
        sortable: false,
        cellTemplate: TextCellDefinition,
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'start' },
        summaryFunc: () => 'Total',
      },
      {
        name: 'Value',
        prop: 'value',
        minWidth: 120,
        sortable: false,
        cellTemplate: TextCellDefinition,
        cellConfig: { align: 'end' },
        headerTemplate: TextHeaderCellDefinition,
        headerConfig: { align: 'end' },
        summaryTemplate: NumberSummaryCellDefinition,
        summaryConfig: { coerce, nonFinite } satisfies NumberSummaryCellConfig,
      },
    ];

    return {
      props: { columns, rows: MEASUREMENTS, summaryPosition },
      template: `
        <ang-table
          style="max-height: 480px;"
          summaryRow
          [columns]="columns"
          [rows]="rows"
          [summaryPosition]="summaryPosition"
        />
      `,
    };
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
