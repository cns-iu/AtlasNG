import type { KgExplorerFilter } from './models';
import type { Row, TableColumn } from '@atlasng/design-system/table';
import {
  CSV_FILE_FORMAT,
  JSON_FILE_FORMAT,
  JSON_LD_FILE_FORMAT,
  type VersionControlFileFormat,
} from '@atlasng/design-system/version-control';
import {
  kgExplorerChipColumn,
  kgExplorerDateColumn,
  kgExplorerLinkColumn,
  kgExplorerNumberColumn,
  kgExplorerTextColumn,
} from './columns';

/** Digital object used by the white-label sample data. */
export interface KgExplorerSampleItem extends Row {
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
export const KG_EXPLORER_SAMPLE_ITEMS: KgExplorerSampleItem[] = SAMPLE_TITLES.map((title, index) => ({
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

/** Columns for {@link KG_EXPLORER_SAMPLE_ITEMS} that mirror the Figma table view. */
export const KG_EXPLORER_SAMPLE_COLUMNS: TableColumn<KgExplorerSampleItem>[] = [
  kgExplorerLinkColumn('Title', 'url', { labelProp: 'title' }),
  kgExplorerTextColumn('Type', 'type'),
  kgExplorerChipColumn('Organs', 'tags'),
  kgExplorerNumberColumn('#Cell types', 'cellTypeCount'),
  kgExplorerNumberColumn('#Biomarkers', 'biomarkerCount'),
  kgExplorerDateColumn('Last modified', 'lastModified'),
];

/** Type and Organ filters for the sample rows, with options derived from the rows. */
export const KG_EXPLORER_SAMPLE_FILTERS: KgExplorerFilter<KgExplorerSampleItem>[] = [
  { id: 'type', label: 'Type', field: 'type', searchDisabled: true },
  { id: 'organ', label: 'Organ', field: 'tags' },
];

/**
 * Reads the download formats of a sample row.
 *
 * @param item Sample row.
 * @returns The file formats the row can be downloaded in.
 */
export function kgExplorerSampleFormats(item: KgExplorerSampleItem): readonly VersionControlFileFormat[] {
  return item.formats;
}
