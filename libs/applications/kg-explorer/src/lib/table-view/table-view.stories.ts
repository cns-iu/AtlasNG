import type { Type } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Footer, FooterAction, FooterLogo } from '@atlasng/design-system/footer';
import type { Row, TableColumn } from '@atlasng/design-system/table';
import {
  CSV_FILE_FORMAT,
  JSON_FILE_FORMAT,
  JSON_LD_FILE_FORMAT,
  type VersionControlFileFormat,
} from '@atlasng/design-system/version-control';
import {
  HeaderShell,
  HeaderShellAction,
  type HeaderShellNavigationItem,
  NavigationContainer,
} from '@atlasng/labs/header-shell';
import { type Args, argsToTemplate, type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { KgExplorerFilter } from '../models';
import {
  kgExplorerChipColumn,
  kgExplorerDateColumn,
  kgExplorerLinkColumn,
  kgExplorerNumberColumn,
  kgExplorerTextColumn,
} from '../utils/columns';
import { KgExplorerTableView } from './table-view';

/** Digital object used by the white-label sample data. */
interface SampleItem extends Row {
  /** Unique identifier of the digital object. */
  id: string;
  /** Human-readable title shown as the row link. */
  title: string;
  /** Link to the digital object's page. */
  url: string;
  /** Digital object type. */
  type: string;
  /** Tags associated with the digital object, such as organs. */
  tags: string[];
  /** Number of cell types described by the digital object. */
  cellTypeCount: number;
  /** Number of biomarkers described by the digital object. */
  biomarkerCount: number;
  /** Date the digital object was last modified, formatted as `YYYY-MM`. */
  lastModified: string;
  /** File formats the digital object can be downloaded in. */
  formats: VersionControlFileFormat[];
}

/** Titles used to generate the white-label sample rows. */
const SAMPLE_TITLES = [
  'Lorem Ipsum Dolor Sit Amet',
  'Dolor Sit Amet Consectetur Adipiscing Elit Lorem Ipsum Dolor',
  'Title of Digital Object Lorem Ipsum Dolor Sit Amet Consectetur Adipiscing Elit Lorem Ipsum',
  'Title of Digital Object Lorem Ipsum Dolor Sit Amet Consectetur Adipiscing Elit',
  'Lorem Ipsum Dolor Sit Amet Consectetur Adipiscing Elit Lorem Ipsum',
  'Consectetur Adipiscing Elit Lorem Ipsum Dolor Sit Amet',
  'Title of Digital Object Lorem Ipsum Dolor Sit Amet',
  'Title of Digital Object Consectetur Adipiscing Elit',
  'Elit Lorem Ipsum Dolor Sit Amet Consectetur Adipiscing',
  'Ipsum Dolor Sit Amet Consectetur Adipiscing Elit',
  'Lorem Ipsum Dolor Sit Amet Consectetur',
  'Sit Amet Consectetur Adipiscing Elit Lorem Ipsum',
  'Title of Digital Object',
  'Title of Digital Object Lorem Ipsum Dolor',
  'Title of Digital Object Lorem Ipsum Dolor Sit Amet Consectetur',
];

/** Digital object types cycled through the sample rows. */
const SAMPLE_TYPES = ['Dataset', 'Reference organ', 'Collection', 'Illustration', 'Ontology'];

/** Tag sets cycled through the sample rows. */
const SAMPLE_TAGS = [['Kidney', 'Heart', 'Lung'], ['Skin'], ['Liver', 'Spleen'], ['Brain', 'Eye', 'Lung', 'Pancreas']];

/** Download format sets cycled through the sample rows: several formats, one format, and none. */
const SAMPLE_FORMATS = [[CSV_FILE_FORMAT, JSON_FILE_FORMAT, JSON_LD_FILE_FORMAT], [CSV_FILE_FORMAT], []];

/** White-label sample rows that mirror the Figma content of the table view. */
const SAMPLE_ITEMS: SampleItem[] = SAMPLE_TITLES.map((title, index) => ({
  id: `digital-object-${index + 1}`,
  title,
  url: `https://example.com/digital-objects/${index + 1}`,
  type: SAMPLE_TYPES[index % SAMPLE_TYPES.length],
  tags: SAMPLE_TAGS[index % SAMPLE_TAGS.length],
  cellTypeCount: (index * 37 + 12) % 1000,
  biomarkerCount: (index * 53 + 7) % 1000,
  lastModified: `2026-${String((index % 12) + 1).padStart(2, '0')}`,
  formats: SAMPLE_FORMATS[index % SAMPLE_FORMATS.length],
}));

/** Builders of the sample columns, keyed by the prefix of their width controls. */
const SAMPLE_COLUMN_BUILDERS = {
  title: (overrides) => kgExplorerLinkColumn('Title', 'url', { labelProp: 'title' }, overrides),
  type: (overrides) => kgExplorerTextColumn('Type', 'type', overrides),
  organs: (overrides) => kgExplorerChipColumn('Organs', 'tags', overrides),
  cellTypes: (overrides) => kgExplorerNumberColumn('#Cell types', 'cellTypeCount', overrides),
  // Wide enough for the label and sort arrow on one line in every brand.
  biomarkers: (overrides) => kgExplorerNumberColumn('#Biomarkers', 'biomarkerCount', { maxWidth: 148, ...overrides }),
  lastModified: (overrides) => kgExplorerDateColumn('Last modified', 'lastModified', { maxWidth: 152, ...overrides }),
} satisfies Record<string, (overrides?: Partial<TableColumn<SampleItem>>) => TableColumn<SampleItem>>;

/** Prefix of a sample column's width controls. */
type SampleColumnKey = keyof typeof SAMPLE_COLUMN_BUILDERS;

/** Story-only args setting each sample column's minimum and maximum width, such as `titleMinWidth`. */
type ColumnWidthArgs = Record<`${SampleColumnKey}${'Min' | 'Max'}Width`, number>;

/** Names of the column width args, kept out of the table view's inputs. */
const COLUMN_WIDTH_ARGS = (Object.keys(SAMPLE_COLUMN_BUILDERS) as SampleColumnKey[]).flatMap((key) => [
  `${key}MinWidth` as const,
  `${key}MaxWidth` as const,
]);

/** Columns for {@link SAMPLE_ITEMS} that mirror the Figma table view. */
const SAMPLE_COLUMNS: TableColumn<SampleItem>[] = Object.values(SAMPLE_COLUMN_BUILDERS).map((build) => build({}));

/**
 * Builds the sample columns with the widths set by the story's controls.
 *
 * @param args Story args holding the column width controls.
 * @returns Sample columns with the controlled minimum and maximum widths.
 */
function sampleColumnsFor(args: Partial<ColumnWidthArgs>): TableColumn<SampleItem>[] {
  return (
    Object.entries(SAMPLE_COLUMN_BUILDERS) as [SampleColumnKey, (typeof SAMPLE_COLUMN_BUILDERS)[SampleColumnKey]][]
  ).map(([key, build]) => build({ minWidth: args[`${key}MinWidth`], maxWidth: args[`${key}MaxWidth`] }));
}

/** Default column width args, read from the column helpers. */
const COLUMN_WIDTH_DEFAULTS = Object.fromEntries(
  (Object.keys(SAMPLE_COLUMN_BUILDERS) as SampleColumnKey[]).flatMap((key, index) => [
    [`${key}MinWidth`, SAMPLE_COLUMNS[index].minWidth],
    [`${key}MaxWidth`, SAMPLE_COLUMNS[index].maxWidth],
  ]),
) as ColumnWidthArgs;

/** Type and Organ filters for the sample rows, with options derived from the rows. */
const SAMPLE_FILTERS: KgExplorerFilter<SampleItem>[] = [
  { id: 'type', label: 'Type', field: 'type', disableSearch: true },
  { id: 'organ', label: 'Organ', field: 'tags' },
];

/**
 * Reads the download formats of a sample row.
 *
 * @param item Sample row.
 * @returns The file formats the row can be downloaded in.
 */
function sampleFormatsFor(item: SampleItem): readonly VersionControlFileFormat[] {
  return item.formats;
}

/** Primary navigation of the sample application header. */
const NAVIGATION_ITEMS: HeaderShellNavigationItem[] = [
  { id: 'kg-explorer', label: 'Knowledge Graph Explorer' },
  { id: 'about', label: 'About' },
];

/**
 * Builds the table view template below the application header, whose action
 * slot holds the filter toggle.
 *
 * @param args Story args.
 * @param content Content projected into the table view.
 * @returns Story template.
 */
function explorerTemplate(args: Args, content = ''): string {
  return `
    <ang-header-shell
      logoUrl="assets/illustration-placeholder.svg"
      hasLocalNavigation="true"
      [navigationItems]="navigationItems"
      [localNavigationExpanded]="navigation.leftMenuOpen()"
      (localNavigationToggle)="navigation.localNavigationToggle()"
      (appsMenuToggle)="navigation.appsMenuToggle()"
    >
      <button
        matIconButton
        angHeaderShellAction
        type="button"
        class="ang-kg-explorer-filter-toggle--button"
        [attr.aria-label]="'Filters'"
        [attr.aria-expanded]="explorer.filtersOpen()"
        (click)="explorer.filtersOpen.update((open) => !open)"
      >
        <mat-icon fontIcon="tune" />
      </button>
    </ang-header-shell>

    <ang-navigation-container [navigationItems]="navigationItems" #navigation>
      <main id="main-content" class="explorer-main">
        <ang-kg-explorer-table-view ${argsToTemplate(args, { exclude: COLUMN_WIDTH_ARGS })} #explorer>
          ${content}
        </ang-kg-explorer-table-view>
      </main>
    </ang-navigation-container>
  `;
}

/** Styles that fit the table view into the height below the header. */
const EXPLORER_STYLES = [
  `ang-header-shell img { height: 100%; }`,
  `.explorer-main { display: flex; flex: 1; flex-direction: column; min-height: 0; }`,
  `.ang-kg-explorer-table-view { flex: 1; min-height: 0; }`,
  `.ang-footer {z-index: 3;}`,
];

/** Story args: the table view's inputs plus the column width controls. */
type StoryArgs = KgExplorerTableView<SampleItem> & ColumnWidthArgs;

/**
 * Renders the table view with the sample columns sized by the width controls.
 *
 * @param args Story args.
 * @param content Content projected into the table view.
 * @returns Story props, template, and styles.
 */
function renderExplorer(args: Args, content = '') {
  return {
    props: { ...args, columns: sampleColumnsFor(args), navigationItems: NAVIGATION_ITEMS },
    template: explorerTemplate(args, content),
    styles: EXPLORER_STYLES,
  };
}

const meta: Meta<StoryArgs> = {
  component: KgExplorerTableView as Type<KgExplorerTableView<SampleItem>>,
  title: 'Applications/KG Explorer/Table View',
  decorators: [
    moduleMetadata({
      imports: [
        Footer,
        FooterAction,
        FooterLogo,
        HeaderShell,
        HeaderShellAction,
        MatButton,
        NavigationContainer,
        MatIconModule,
        MatButtonModule,
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=8695-21',
    },
  },
  args: {
    items: SAMPLE_ITEMS,
    columns: SAMPLE_COLUMNS,
    filters: SAMPLE_FILTERS,
    filtersOpen: false,
    config: { downloadFormats: sampleFormatsFor },
    ...COLUMN_WIDTH_DEFAULTS,
  },
  argTypes: {
    download: { action: 'download' },
    columns: { control: false },
    ...Object.fromEntries(
      COLUMN_WIDTH_ARGS.map((name) => [
        name,
        { control: { type: 'number', min: 0, step: 4 }, table: { category: 'Column widths' } },
      ]),
    ),
  },
  render: (args) => renderExplorer(args),
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {};

export const Demo: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Viewing 15 of 15', { ignore: '.cdk-visually-hidden' })).toBeVisible();

    await userEvent.type(canvas.getByRole('combobox', { name: 'Search' }), 'consectetur');
    // Give viewers time to see the filtered results and suggestions.
    waitFor(
      () =>
        expect(canvas.getByText(/^Viewing \d+ of 15$/, { ignore: '.cdk-visually-hidden' })).not.toHaveTextContent(
          'Viewing 15 of 15',
        ),
      {
        timeout: 2000,
      },
    );

    const [downloadButton] = canvas.getAllByRole('button', { name: /^Choose download format for / });
    await userEvent.click(downloadButton);
    const menu = within(document.body).getByRole('menu');
    await expect(within(menu).getByRole('menuitem', { name: /CSV/ })).toBeVisible();
    await userEvent.keyboard('{Escape}');
  },
};

export const Dark: Story = {
  globals: {
    theme: 'WPP Dark',
  },
};

export const FiltersOpen: Story = {
  args: {
    filtersOpen: true,
  },
};

export const ExtraLargeFilterBreakpoint: Story = {
  args: {
    config: { filtersDockBreakpoint: 'x-large' },
  },
};

export const NoResults: Story = {
  args: {
    search: 'no matching digital object',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No results. Adjust filters or search again.')).toBeVisible();
  },
};

export const FewResults: Story = {
  args: {
    items: SAMPLE_ITEMS.slice(0, 3),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('End of results')).toBeVisible();
  },
};

export const WithoutDownload: Story = {
  args: {
    config: {},
  },
};

export const WithFooter: Story = {
  args: {
    items: SAMPLE_ITEMS,
  },
  render: (args) =>
    renderExplorer(
      args,
      `
        <ang-footer logoSrc="" organization="Organization">
          <ang-footer-logo>Logo</ang-footer-logo>
          <a angFooterAction matButton>Privacy</a>
          <a angFooterAction matButton>Accessibility</a>
        </ang-footer>
      `,
    ),
  play: async ({ canvas }) => {
    const footer = canvas.getByRole('contentinfo');
    // Scroll through the table to the footer after the last row.
    footer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    await expect(footer).toBeVisible();
  },
};
