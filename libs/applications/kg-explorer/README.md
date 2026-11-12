# @atlasng/kg-explorer

White-label knowledge graph explorer in table view. It combines a filter menu with a searchable, sortable results table and per-row downloads, built from AtlasNG design-system components and Angular Material.

The library is in early development; its public API may still change. The header and footer shells are not included.

## Usage

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

## Layout

| Area          | Behavior                                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filter menu   | Shows an `ang-multi-select-filter` for each entry of `filters`. Docked on the left from the Angular Material large breakpoint (1280px) up; below that it is a drawer opened and closed through `[(filtersOpen)]`.                     |
| Results table | Search bar with autocomplete, "Viewing X of Y" counter, and sortable `ang-table`, all inside an `ang-scroll-area` together with the end-of-results indicator and any table end content. The no-results indicator replaces empty rows. |
| Padding       | Around the search bar and the table: 20px below 960px, and 32px from there up.                                                                                                                                                        |

## Data and columns

- `items` takes any row type, and `columns` (required) sets which properties the table shows. There are no built-in default columns.
- Build columns with the generic helpers, which apply the Figma column widths and cell types: `kgExplorerLinkColumn(name, prop, { labelProp | labelFn | label })`, `kgExplorerTextColumn`, `kgExplorerChipColumn` (one chip per array value, unsortable), `kgExplorerNumberColumn`, and `kgExplorerDateColumn`. Each takes optional `TableColumn` overrides as its last argument, and you can mix in plain `TableColumn` objects. Create the array once and reuse it, because the table caches cell templates by column identity.
- `filters` takes `KgExplorerFilter` definitions, and `[(filterSelections)]` holds the selected options of each filter, keyed by filter `id`. Clearing the results from the no-results indicator resets the selections and the search term.

## Filters

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

## Inputs and outputs

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

## Configuration

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

### Search

Rows are searched with `@atlasng/cdk/search`, and matching rows keep the order of `items`. Use `provideSearch` from `@atlasng/cdk/search` to change the number of suggestions (`suggestionLimit`, 10 by default), the debounce, or the search engine.

### Downloads

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

## Known limitations

The search bar, counter, and table share one scroll area, and the table grows to fit all of its rows. The search bar and the column headers are not sticky, so they scroll out of view in long result lists.

## Development

| Task      | Command                        |
| --------- | ------------------------------ |
| Build     | `npx nx build kg-explorer`     |
| Test      | `npx nx test kg-explorer`      |
| Lint      | `npx nx lint kg-explorer`      |
| Storybook | `npx nx storybook kg-explorer` |

The Storybook stories under `Applications/KG Explorer` are the white-label demo and link to the Figma design.
