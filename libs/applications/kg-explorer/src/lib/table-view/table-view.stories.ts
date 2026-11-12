import type { Type } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Footer, FooterAction, FooterLogo } from '@atlasng/design-system/footer';
import { type Args, argsToTemplate, type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { Row, TableColumn } from '@atlasng/design-system/table';
import {
  CSV_FILE_FORMAT,
  JSON_FILE_FORMAT,
  JSON_LD_FILE_FORMAT,
  type VersionControlFileFormat,
} from '@atlasng/design-system/version-control';
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

/** Columns for {@link SAMPLE_ITEMS} that mirror the Figma table view. */
const SAMPLE_COLUMNS: TableColumn<SampleItem>[] = [
  kgExplorerLinkColumn('Title', 'url', { labelProp: 'title' }),
  kgExplorerTextColumn('Type', 'type'),
  kgExplorerChipColumn('Organs', 'tags'),
  kgExplorerNumberColumn('#Cell types', 'cellTypeCount'),
  kgExplorerNumberColumn('#Biomarkers', 'biomarkerCount'),
  kgExplorerDateColumn('Last modified', 'lastModified'),
];

/** Type and Organ filters for the sample rows, with options derived from the rows. */
const SAMPLE_FILTERS: KgExplorerFilter<SampleItem>[] = [
  { id: 'type', label: 'Type', field: 'type', searchDisabled: true },
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

/**
 * Builds the table view template.
 *
 * @param args Story args.
 * @param content Content projected into the table view.
 * @returns Story template.
 */
function explorerTemplate(args: Args, content = ''): string {
  return `
    <ang-kg-explorer-table-view ${argsToTemplate(args)}>
      ${content}
    </ang-kg-explorer-table-view>
  `;
}

const meta: Meta<KgExplorerTableView<SampleItem>> = {
  component: KgExplorerTableView as Type<KgExplorerTableView<SampleItem>>,
  title: 'Applications/KG Explorer',
  decorators: [
    moduleMetadata({
      imports: [Footer, FooterAction, FooterLogo, MatButton],
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
  },
  argTypes: {
    download: { action: 'download' },
  },
  render: (args) => ({
    props: args,
    template: explorerTemplate(args),
    styles: [
      `
        .ang-kg-explorer-table-view {
          height: 100vh;
        }
      `,
    ],
  }),
};

export default meta;

type Story = StoryObj<KgExplorerTableView<SampleItem>>;

export const Default: Story = {};

export const Demo: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Viewing 15 of 15')).toBeVisible();

    await userEvent.type(canvas.getByRole('combobox', { name: 'Search' }), 'consectetur');
    // Give viewers time to see the filtered results and suggestions.
    waitFor(() => expect(canvas.getByText(/^Viewing \d+ of 15$/)).not.toHaveTextContent('Viewing 15 of 15'), {
      timeout: 2000,
    });

    const [downloadButton] = canvas.getAllByRole('button', { name: 'Choose download format' });
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
  render: (args) => ({
    props: args,
    template: explorerTemplate(
      args,
      `
        <ang-footer logoImage="" organization="Organization">
          <ang-footer-logo>Logo</ang-footer-logo>
          <a angFooterAction matButton>Privacy</a>
          <a angFooterAction matButton>Accessibility</a>
        </ang-footer>
      `,
    ),
  }),
  play: async ({ canvas }) => {
    const footer = canvas.getByRole('contentinfo');
    // Scroll through the table to the footer after the last row.
    footer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    await expect(footer).toBeVisible();
  },
};
