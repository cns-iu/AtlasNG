import { Component, TemplateRef, Type, viewChild } from '@angular/core';
import {
  CellContext,
  CellDefinition,
  CellTemplateContext,
  DatatableSummaryRowDirective,
  Row,
  Table,
  TableColumn,
} from '../index';
import { CheckboxCellDefinition, CheckboxHeaderCellDefinition } from '@atlasng/design-system/table/columns';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

/** Row displayed in table stories. */
interface Person extends Row {
  name: string;
  role: string;
  score: number;
}

/** Representative story data. */
const ROWS: Person[] = [
  { name: 'Ada Lovelace', role: 'Mathematician', score: 96 },
  { name: 'Grace Hopper', role: 'Computer scientist', score: 94 },
  { name: 'Katherine Johnson', role: 'Mathematician', score: 98 },
  { name: 'Margaret Hamilton', role: 'Software engineer', score: 97 },
];

/** Default story columns. */
const COLUMNS: TableColumn<Person>[] = [
  { name: 'Name', prop: 'name', flexGrow: 2 },
  { name: 'Role', prop: 'role', flexGrow: 2 },
  { name: 'Score', prop: 'score' },
];

/** Custom story definition that emphasizes high scores. */
@Component({
  selector: 'ang-table-score-cell-definition',
  imports: [CellTemplateContext],
  template: `
    <ng-template let-value="value" angCellTemplateContext #template>
      <strong>{{ value }}%</strong>
    </ng-template>
  `,
})
class ScoreCellDefinition extends CellDefinition<Person> {
  /** Template rendered for every score cell. */
  readonly template = viewChild.required<TemplateRef<CellContext<Person>>>('template');
}

const meta: Meta<Table<Person>> = {
  title: 'Design System/Table',
  component: Table as Type<Table<Person>>,
  decorators: [
    moduleMetadata({
      imports: [Table, DatatableSummaryRowDirective],
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
    rows: ROWS,
    columns: COLUMNS,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="height: 320px;">
        <ang-table ${argsToTemplate(args)} />
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<Table<Person>>;

/** Basic virtualized table. */
export const Default: Story = {};

/** Table with an explicit Material checkbox selection column. */
export const WithSelection: Story = {
  args: {
    selectionType: 'checkbox',
    selected: [ROWS[0]],
    columns: [
      {
        name: 'Select',
        prop: '$select',
        sortable: false,
        width: 48,
        maxWidth: 48,
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

/** Table displaying the standard loading indicator. */
export const WithLoading: Story = {
  args: {
    rows: [],
    loadingIndicator: true,
  },
};

/** Table with a computed score summary. */
export const WithSummaryRow: Story = {
  args: {
    summaryRow: true,
    columns: [
      { name: 'Name', prop: 'name', flexGrow: 2 },
      { name: 'Role', prop: 'role', flexGrow: 2 },
      {
        name: 'Score',
        prop: 'score',
        summaryFunc: (values: number[]) =>
          Math.round(values.reduce((total, value) => total + value, 0) / values.length),
      },
    ],
  },
};

/** Header cells aligned using public header classes. */
export const WithHeaderAlignment: Story = {
  args: {
    columns: [
      { name: 'Start', prop: 'name', headerClass: 'ang-table--header-align-start' },
      { name: 'Center', prop: 'role', headerClass: 'ang-table--header-align-center' },
      { name: 'End', prop: 'score', headerClass: 'ang-table--header-align-end' },
    ],
  },
};

/** Table using a reusable component type as a body-cell template. */
export const WithCustomCellDefinition: Story = {
  args: {
    columns: [...COLUMNS.slice(0, 2), { name: 'Score', prop: 'score', cellTemplate: ScoreCellDefinition }],
  },
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
