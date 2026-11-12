# @atlasng/kg-explorer

White-label knowledge graph explorer in table view. It combines a filter menu with a searchable, sortable results table and per-row downloads, built from AtlasNG design-system components and Angular Material.

The library is in early development; its public API may still change. The header and footer shells are not included.

## Usage

```ts
import { Component } from '@angular/core';
import {
  KgExplorerTableView,
  kgExplorerLinkColumn,
  kgExplorerNumberColumn,
  kgExplorerTextColumn,
  type KgExplorerDownloadRequest,
} from '@atlasng/kg-explorer';

interface Dataset {
  name: string;
  url: string;
  organ: string;
  cellCount: number;
}

@Component({
  imports: [KgExplorerTableView],
  template: `<ang-kg-explorer-table-view [items]="items" [columns]="columns" (download)="onDownload($event)" />`,
})
export class ExplorerPage {
  readonly items: Dataset[] = [];

  readonly columns = [
    kgExplorerLinkColumn<Dataset>('Dataset', 'url', { labelProp: 'name' }),
    kgExplorerTextColumn<Dataset>('Organ', 'organ'),
    kgExplorerNumberColumn<Dataset>('#Cells', 'cellCount'),
  ];

  onDownload({ item, format }: KgExplorerDownloadRequest<Dataset>): void {
    // Start the download of `item` in `format`.
  }
}
```

Give the explorer a height (for example, fill the page below your header) and apply an AtlasNG theme such as the WPP theme. The theme should follow the user's system color scheme by default.

## Layout

| Area          | Behavior                                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filter menu   | Shows an `ang-multi-select-filter` for each entry of `filters`. Docked on the left from the Angular Material large breakpoint (1280px) up; below that it is a drawer opened and closed through `[(filtersOpen)]`.                     |
| Results table | Search bar with autocomplete, "Viewing X of Y" counter, and sortable `ang-table`, all inside an `ang-scroll-area` together with the end-of-results indicator and any table end content. The no-results indicator replaces empty rows. |
| Padding       | Around the search bar and the table: 20px below 960px, and 32px from there up.                                                                                                                                                        |

## Data and columns

- `items` takes any row type, and `columns` (required) sets which properties the table shows. There are no built-in default columns.
- Build columns with the generic helpers, which apply the Figma column widths and cell types: `kgExplorerLinkColumn(name, prop, { labelProp | labelFn | label })`, `kgExplorerTextColumn`, `kgExplorerChipColumn` (one chip per array value, unsortable), `kgExplorerNumberColumn`, and `kgExplorerDateColumn`. Each takes optional `TableColumn` overrides as its last argument, and you can mix in plain `TableColumn` objects. Create the array once and reuse it, because the table caches cell templates by column identity.
- `KG_EXPLORER_SAMPLE_ITEMS` and `KG_EXPLORER_SAMPLE_COLUMNS` (with the `KgExplorerSampleItem` row type) are white-label demo data used by the stories.
- `filters` takes `KgExplorerFilter` definitions (`id`, `label`, `options`, and optional `searchDisabled` and `count`). `[(filterSelections)]` holds the selected options of each filter, keyed by filter `id`. Clearing the results from the no-results indicator resets the selections before `(clearFilters)` emits.
- The explorer does not filter `items` itself: pass only the rows that match `filterSelections`. `KG_EXPLORER_SAMPLE_FILTERS` defines Type and Organ filters for the sample data.
- `searchFn` decides which rows match the search term (defaults to matching any string, number, or array value). `searchLabelFn` provides autocomplete suggestions (defaults to the row `title`); at most `maxSuggestions` are shown (see [Configuration](#configuration)).
- `downloadFormats` sets the file formats in the per-row download menu (defaults to `FILE_FORMATS` from `@atlasng/design-system/version-control`). Picking a format emits `download` with `{ item, format }`. `KgExplorerDownloadCellDefinition` can also be used on its own in any `ang-table` column.

## Inputs and outputs

| Name                              | Description                                                          |
| --------------------------------- | -------------------------------------------------------------------- |
| `items`, `columns`                | Rows to display and the columns that show them.                      |
| `filters`, `[(filterSelections)]` | Filter definitions and the selected options of each filter.          |
| `[(search)]`, `[(sorts)]`         | Current search term and column sorts.                                |
| `searchFn`, `searchLabelFn`       | Search matching and autocomplete labels.                             |
| `downloadFormats`                 | File formats in the per-row download menu.                           |
| `[(filtersOpen)]`                 | Whether the filter drawer is open below the large breakpoint.        |
| `(download)`, `(clearFilters)`    | Download requests, and clear requests from the no-results indicator. |

## Show and hide features

Boolean inputs that default to `false`:

| Input                    | Effect                             |
| ------------------------ | ---------------------------------- |
| `downloadDisabled`       | Hides the download column          |
| `endOfResultsDisabled`   | Hides the end-of-results indicator |
| `resultsCounterDisabled` | Hides the "Viewing X of Y" counter |
| `searchDisabled`         | Hides the search field             |

## Slots

Project a template to add content, such as a footer, at the end of the table:

```html
<ang-kg-explorer-table-view [items]="items" [columns]="columns">
  <ng-template angKgExplorerTableEnd>
    <!-- Footer or other content after the last row -->
  </ng-template>
</ang-kg-explorer-table-view>
```

`angKgExplorerTableEnd` content renders after the table and the end-of-results indicator, and scrolls with them.

## Building blocks

The parts of the explorer are exported too, so you can build your own layout:

- `KgExplorerResultsTable` (`ang-kg-explorer-results-table`) is the search bar, counter, and table. It fills its container's height, so give the container one. Pass content for the end of its table through its `tableEndTemplate` input.
- `KgExplorerResultsNavigation` (`ang-kg-explorer-results-navigation`) is only the search field and counter. It displays the `suggestions`, `count`, and `total` you pass in and two-way binds `search`.
- `KgExplorerDownloadCellDefinition` is the per-row download menu as an `ang-table` cell definition.

## Configuration

Provide `provideKgExplorerConfig` to change the explorer's defaults. Omitted values keep their defaults.

```ts
providers: [provideKgExplorerConfig({ maxSuggestions: 5 })];
```

| Option           | Default | Description                                                     |
| ---------------- | ------- | --------------------------------------------------------------- |
| `maxSuggestions` | `8`     | Maximum number of autocomplete suggestions below the search bar |

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
