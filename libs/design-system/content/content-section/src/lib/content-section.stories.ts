import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Row, Table, TableColumn } from '@atlasng/design-system/table';
import {
  CodeCellDefinition,
  LinkCellDefinition,
  NumberCellDefinition,
  TextCellDefinition,
  TextHeaderCellDefinition,
} from '@atlasng/design-system/table/columns';
import { YouTubePlayer } from '@atlasng/design-system/youtube-player';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { ContentSection } from './content-section';

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

const SAMPLE_TEXT =
  'Lorem ipsum dolor sit amet consectetur adipiscing elit. Consectetur adipiscing elit quisque faucibus ex sapien vitae. Ex sapien vitae pellentesque sem placerat in id. Placerat in id cursus mi pretium tellus duis. Pretium tellus duis convallis tempus leo eu aenean.';

/**
 * UX Content Design 📐
 *
 * - Try to start with text first.
 * - Do not use a CTA button if the section header has a CTA button.
 * - If content becomes lengthy in one section, consider nesting lower level sections within it.
 */
const meta: Meta<ContentSection> = {
  title: 'Design System/Content/Content Section',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=2568-226',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [ContentSection, Table, MatButtonModule, YouTubePlayer, MatFormFieldModule, MatInputModule],
    }),
  ],
  args: {
    underlined: true,
  },
};

export default meta;
type Story = StoryObj<ContentSection>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      @for (level of [1, 2, 3, 4, 5, 6]; track level) {
        <ang-content-section
          [title]="'Section title h' + level"
          [id]="'section-title-' + level"
          [underlined]="underlined"
          [level]="level"
        >
          <span>${SAMPLE_TEXT}</span>
        </ang-content-section>
      }
    `,
    styles: ['ang-content-section { margin-bottom: 2rem; }'],
  }),
};

export const WithContent: Story = {
  render: (args) => ({
    props: { ...args, rows: ROWS, columns: COLUMNS },
    template: `
      <ang-content-section title="People" id="people" level="2">
        <span>${SAMPLE_TEXT}</span>
        <span>${SAMPLE_TEXT}</span>
        <ang-table [rows]="rows" [columns]="columns" />
        <div>
          <button matButton="filled">Action button</button>
          <button matButton>Action button</button>
        </div>
        <img [attr.src]="'assets/placeholder-256x256.png'" alt="Placeholder image" />
        <ang-youtube-player videoId="dQw4w9WgXcQ"></ang-youtube-player>
        <mat-form-field>
          <mat-label>Input</mat-label>
          <input matInput />
        </mat-form-field>
      </ang-content-section>
    `,
    styles: [
      'div {display: flex; gap: 1rem;}',
      'button, mat-form-field { width: fit-content; }',
      'ang-table { max-height: 240px; }',
      'img { width: 750px; max-width: 100%; aspect-ratio: 16/9; object-fit: cover; }',
    ],
  }),
};
