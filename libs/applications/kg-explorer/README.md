# @atlasng/kg-explorer

White-label knowledge graph explorer, built from AtlasNG design-system components and Angular Material. It provides two page bodies: the [table view](#table-view), which lists digital objects, and the [metadata view](#metadata-view), which shows one of them.

The library is in early development; its public API may still change. The header and footer shells are not included.

## Installation

```sh
npm install @atlasng/kg-explorer @google/model-viewer three papaparse
```

Besides the Angular and AtlasNG packages, these peer dependencies are required:

| Package                | Used by                                       |
| ---------------------- | --------------------------------------------- |
| `@google/model-viewer` | `MetadataModel` 3D viewers (requires `three`) |
| `papaparse`            | `MetadataTable`, to parse CSV files           |

`@google/model-viewer` is imported when the library loads, so it is part of the bundle even on pages without a model.

## Table view

`ang-kg-explorer-table-view` combines a filter menu with a searchable, sortable results table and per-row downloads.

### Usage

```ts
import { Component } from '@angular/core';
import { CSV_FILE_FORMAT, JSON_FILE_FORMAT } from '@atlasng/design-system/version-control';
import {
  KgExplorerTableView,
  kgExplorerLinkColumn,
  kgExplorerNumberColumn,
  kgExplorerTextColumn,
  type KgExplorerDownloadRequest,
  type KgExplorerTableViewConfig,
} from '@atlasng/kg-explorer';

interface Dataset {
  name: string;
  url: string;
  organ: string;
  cellCount: number;
}

@Component({
  imports: [KgExplorerTableView],
  template: `
    <ang-kg-explorer-table-view [items]="items" [columns]="columns" [config]="config" (download)="onDownload($event)" />
  `,
})
export class ExplorerPage {
  readonly items: Dataset[] = [];

  readonly columns = [
    kgExplorerLinkColumn<Dataset>('Dataset', 'url', { labelProp: 'name' }),
    kgExplorerTextColumn<Dataset>('Organ', 'organ'),
    kgExplorerNumberColumn<Dataset>('#Cells', 'cellCount'),
  ];

  readonly config: KgExplorerTableViewConfig<Dataset> = {
    searchSuggestionField: 'name',
    downloadFormats: [CSV_FILE_FORMAT, JSON_FILE_FORMAT],
  };

  onDownload({ item, format }: KgExplorerDownloadRequest<Dataset>): void {
    // Start the download of `item` in `format`.
  }
}
```

Give the table view a height (for example, fill the page below your header) and apply an AtlasNG theme such as the WPP theme. The theme should follow the user's system color scheme by default.

### Layout

| Area          | Behavior                                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filter menu   | Shows an `ang-multi-select-filter` for each entry of `filters`. Docked on the left from the Angular Material large breakpoint (1280px) up; below that it is a drawer opened and closed through `[(filtersOpen)]`.                     |
| Results table | Search bar with autocomplete, "Viewing X of Y" counter, and sortable `ang-table`, all inside an `ang-scroll-area` together with the end-of-results indicator and any table end content. The no-results indicator replaces empty rows. |
| Padding       | Around the search bar and the table: 20px below 960px, and 32px from there up.                                                                                                                                                        |

### Data and columns

- `items` takes any row type, and `columns` (required) sets which properties the table shows. There are no built-in default columns.
- Build columns with the generic helpers, which apply the Figma column widths and cell types: `kgExplorerLinkColumn(name, prop, { labelProp | labelFn | label })`, `kgExplorerTextColumn`, `kgExplorerChipColumn` (one chip per array value, unsortable), `kgExplorerNumberColumn`, and `kgExplorerDateColumn`. Each takes optional `TableColumn` overrides as its last argument, and you can mix in plain `TableColumn` objects. Create the array once and reuse it, because the table caches cell templates by column identity.
- `filters` takes `KgExplorerFilter` definitions, and `[(filterSelections)]` holds the selected options of each filter, keyed by filter `id`. Clearing the results from the no-results indicator resets the selections and the search term.

### Filters

```ts
filters: KgExplorerFilter<Dataset>[] = [
  { id: 'organ', label: 'Organ', field: 'organ' },
  { id: 'size', label: 'Size', options: SIZE_OPTIONS, matches: (row, selected) => selected.some((size) => inRange(row, size)) },
];
```

| Property         | Description                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `id`, `label`    | Key of the filter in `filterSelections`, and the name on its button.                                              |
| `field`          | Row key, or function returning a row's value or values. A row matches when it has the label of a selected option. |
| `matches`        | `(row, selected) => boolean`, used instead of the `field` comparison.                                             |
| `options`        | Options of the filter. When omitted, the distinct `field` values of `items` are listed with their row counts.     |
| `searchDisabled` | Hides the search field of the filter's list.                                                                      |
| `count`          | Number shown by the filter's counter. Defaults to the number of options.                                          |

- A row is shown when it matches every filter that has a selection; within one filter, any selected option is enough.
- Filtering is applied by the search after the index is built, so changing a selection does not rebuild the index, and suggestions only come from rows that pass the filters. "Viewing X of Y" counts against all `items`.
- Derived option counts are the number of `items` with that value. They do not change with the search term or other filters.
- A filter without `field` and `matches` does not narrow the rows. Read `filterSelections` and pass the matching `items` yourself, for example when filtering on a server.

### Inputs and outputs

| Name                              | Description                                                   |
| --------------------------------- | ------------------------------------------------------------- |
| `items`, `columns`                | Rows to display and the columns that show them.               |
| `filters`, `[(filterSelections)]` | Filter definitions and the selected options of each filter.   |
| `config`                          | Search, download, and visibility options (see below).         |
| `[(search)]`, `[(sorts)]`         | Current search term and column sorts.                         |
| `[(filtersOpen)]`                 | Whether the filter drawer is open below the large breakpoint. |
| `(download)`                      | Emits `{ item, format }` when a user downloads a row.         |

Content projected into the table view, such as a footer, renders after the table and the end-of-results indicator, and scrolls with them:

```html
<ang-kg-explorer-table-view [items]="items" [columns]="columns">
  <ang-footer />
</ang-kg-explorer-table-view>
```

### Configuration

`config` takes a `KgExplorerTableViewConfig`. Every option is optional.

| Option                      | Default     | Description                                                                                         |
| --------------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| `searchFields`              | all values  | Fields to search: row keys or computed fields. Defaults to every string, number, and array of them. |
| `searchSuggestionField`     | row `title` | Field whose values are suggested below the search field.                                            |
| `searchSuggestionsDisabled` | `false`     | Turns the suggestions off.                                                                          |
| `searchDisabled`            | `false`     | Hides the search field.                                                                             |
| `resultsCounterDisabled`    | `false`     | Hides the "Viewing X of Y" counter.                                                                 |
| `endOfResultsDisabled`      | `false`     | Hides the end-of-results indicator.                                                                 |
| `downloadFormats`           | none        | File formats of the download column. The column is only shown when this is set.                     |

Set defaults for every table view below an injector with `provideKgExplorerTableView`. The `config` input is merged over them, and options left out or set to `undefined` keep the provided value.

```ts
providers: [provideKgExplorerTableView({ endOfResultsDisabled: true })];
```

#### Search

Rows are searched with `@atlasng/cdk/search`, and matching rows keep the order of `items`. Use `provideSearch` from `@atlasng/cdk/search` to change the number of suggestions (`suggestionLimit`, 10 by default), the debounce, or the search engine.

#### Downloads

`downloadFormats` is either one list of formats for every row or a function that returns the formats of a row:

```ts
config = { downloadFormats: (dataset: Dataset) => dataset.formats };
```

| Formats of a row | Download button                                |
| ---------------- | ---------------------------------------------- |
| Several          | Opens a menu of the formats.                   |
| One              | Downloads that format directly.                |
| None             | Disabled, with a "No downloads available" tip. |

Formats can be any type that extends `VersionControlFileFormat`, for example with a `url`; `(download)` emits the picked format object unchanged. `KgExplorerDownloadCellDefinition` is the same download button as an `ang-table` cell definition for use in your own tables.

### Known limitations

The search bar, counter, and table share one scroll area, and the table grows to fit all of its rows. The search bar and the column headers are not sticky, so they scroll out of view in long result lists.

## Metadata view

`ang-kg-explorer-metadata-view` is a page layout template that displays the metadata of a single data entry, such as a knowledge graph digital object. It accepts plain data, so it works with any data source, and renders only the page body. Compose it with a header (for example `ang-header-shell` from `@atlasng/labs/header-shell`) and `ang-footer` from `@atlasng/design-system/footer`.

```html
<ang-kg-explorer-metadata-view
  [metadata]="entry"
  [breadcrumbs]="breadcrumbs"
  [config]="{ versionControlTagline: 'Dataset version' }"
  (download)="downloadFile($event)"
/>
```

### Inputs and outputs

| Name                  | Default       | Description                                                           |
| --------------------- | ------------- | --------------------------------------------------------------------- |
| `metadata`            | required      | `KgExplorerMetadata`: the entry to display (see below).               |
| `breadcrumbs`         | `[]`          | `BreadcrumbItem[]` from `@atlasng/design-system/buttons/breadcrumbs`. |
| `config`              | `{}`          | `KgExplorerMetadataViewConfig` options (see below).                   |
| `[(selectedVersion)]` | first version | Two-way bindable selected version.                                    |
| `(download)`          |               | Emits `{ item, format }` when a download option is chosen.            |

`KgExplorerMetadata` describes one entry:

| Property   | Required | Description                                                                        |
| ---------- | -------- | ---------------------------------------------------------------------------------- |
| `title`    | yes      | Page title, rendered as the `h1`.                                                  |
| `sections` | yes      | `KgExplorerMetadataSection[]` rendered in order below the title.                   |
| `url`      | no       | URL shown in a copyable link snippet.                                              |
| `icons`    | no       | `KgExplorerMetadataIcon[]` (`{ src, alt }`) shown as 64px circles above the title. |
| `versions` | no       | `VersionControlItem[]` from `@atlasng/design-system/version-control`.              |

Breadcrumbs, icons, and the URL are hidden when they have no data; leave them out to hide them. The version control panel is always displayed; without versions its selector is disabled.

### Configuration

`config` takes a `KgExplorerMetadataViewConfig`. Every option is optional.

| Option                    | Default                    | Description                                   |
| ------------------------- | -------------------------- | --------------------------------------------- |
| `versionControlTagline`   | `'Digital object version'` | Heading of the version control panel.         |
| `sectionHeadingLevel`     | `2`                        | Heading level of the section titles.          |
| `sectionDividersDisabled` | `false`                    | Hides the divider beneath each section title. |

Set defaults for every metadata view below an injector with `provideKgExplorerMetadataView`. The `config` input is merged over them, and options left out or set to `undefined` keep the provided value.

```ts
providers: [provideKgExplorerMetadataView({ sectionHeadingLevel: 3 })];
```

### Section content

A section is `{ title, content }`. `content` is one content-block node or a list of them, rendered with `ang-content-block` from `@atlasng/content-blocks`. The page registers these definitions:

| Component          | Source                                              | Renders                                             |
| ------------------ | --------------------------------------------------- | --------------------------------------------------- |
| `ContentParagraph` | design-system definitions                           | A paragraph of text and inline nodes.               |
| `TextLink`         | design-system definitions                           | A link. `config.href` is the destination.           |
| `MetadataImage`    | `KG_EXPLORER_METADATA_DEFINITIONS` (`{ src, alt }`) | An image spanning the full content width.           |
| `MetadataChips`    | `KG_EXPLORER_METADATA_DEFINITIONS` (`{ labels }`)   | A group of non-interactive chips, for example tags. |
| `MetadataModel`    | `KG_EXPLORER_METADATA_DEFINITIONS` (`{ src, alt }`) | An interactive 3D model, for example a GLB file.    |
| `MetadataTable`    | `KG_EXPLORER_METADATA_DEFINITIONS` (`{ url }`)      | A sortable table loaded from a CSV file.            |

The other design-system definitions are available too.

```ts
const sections: KgExplorerMetadataSection[] = [
  {
    title: 'Description',
    content: [
      { component: 'ContentParagraph', content: 'A description of the entry.' },
      { component: 'MetadataImage', config: { src: 'assets/illustration.svg', alt: 'Illustration of the entry' } },
    ],
  },
  {
    title: 'License',
    content: {
      component: 'ContentParagraph',
      content: [
        'CC BY 4.0 (',
        { component: 'TextLink', config: { href: 'https://creativecommons.org/licenses/by/4.0/' }, content: 'license' },
        ')',
      ],
    },
  },
  { title: 'Tags', content: { component: 'MetadataChips', config: { labels: ['Heart', 'Kidney'] } } },
];
```

#### Primary file

Show the entry's primary file inline by adding a node for it to a section, usually the first one:

- **Illustration (SVG):** use `MetadataImage`.
- **3D model (GLB):** use `MetadataModel`. It renders the [`model-viewer`](https://modelviewer.dev/) web component, so users can rotate and zoom the model.

```ts
{
  title: '3D model',
  content: { component: 'MetadataModel', config: { src: 'assets/kidney.glb', alt: '3D model of the left kidney' } },
}
```

#### Tables

`MetadataTable` loads a CSV file and shows it in a sortable design-system table. The first line is the header. Columns with only numeric values are right-aligned. If the file fails to load, a notice is shown instead.

```ts
{ title: 'Anatomical structures', content: { component: 'MetadataTable', config: { url: 'assets/structures.csv' } } }
```

The file is fetched with `fetch`, so it must be same-origin or allow CORS, and parsed with [Papa Parse](https://www.papaparse.com/). The table grows up to `--ang-kg-explorer-metadata-view-table-max-height` and then scrolls.

### Downloads

The page does not download files. Choosing a download option emits `download` with `{ item, format }`, and the consumer performs the download. Extend `VersionControlFileFormat` with your own fields, such as a URL, to get them back in the event.

### Responsive layout

- Below the `medium` breakpoint (960px), the page is a single column with 20px side padding, and the version control panel follows the first section.
- From `medium` up, the version control panel is a 400px column beside the sections, with 40px padding. The layout is centered and at most 1600px wide.

Spacing can be customized with these CSS variables:

| Variable                                                 | Default  | Effect                                                                  |
| -------------------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| `--ang-kg-explorer-metadata-view-section-gap`            | `2.5rem` | Space between sections                                                  |
| `--ang-kg-explorer-metadata-view-padding`                | `2.5rem` | Page padding from `medium` up                                           |
| `--ang-kg-explorer-metadata-view-version-control-offset` | `0rem`   | Extra space kept clear above the sticky panel, e.g. for a sticky header |
| `--ang-kg-explorer-metadata-view-model-height`           | `30rem`  | Height of `MetadataModel` viewers                                       |
| `--ang-kg-explorer-metadata-view-table-max-height`       | `30rem`  | Maximum height of `MetadataTable` tables; longer tables scroll          |

Colors and typography come from the active Material theme, so the page follows the WPP light and dark themes.

## Development

| Task      | Command                        |
| --------- | ------------------------------ |
| Build     | `npx nx build kg-explorer`     |
| Test      | `npx nx test kg-explorer`      |
| Lint      | `npx nx lint kg-explorer`      |
| Storybook | `npx nx storybook kg-explorer` |

The Storybook stories under `Applications/KG Explorer` are the white-label demo and link to the Figma design.
