# @atlasng/kg-explorer

White-label knowledge graph explorer in table view. It combines a filter menu with a searchable, sortable results table and per-row downloads, built from AtlasNG design-system components and Angular Material.

The library is in early development; its public API may still change. The header and footer shells are not included, and the filter menu is a placeholder until the filter form component is available.

## Usage

```ts
import { Component } from '@angular/core';
import {
  KgExplorer,
  kgExplorerLinkColumn,
  kgExplorerNumberColumn,
  kgExplorerTextColumn,
  type KgExplorerDownload,
} from '@atlasng/kg-explorer';

interface Dataset {
  name: string;
  url: string;
  organ: string;
  cellCount: number;
}

@Component({
  imports: [KgExplorer],
  template: `<ang-kg-explorer [items]="items" [columns]="columns" (download)="onDownload($event)" />`,
})
export class ExplorerPage {
  readonly items: Dataset[] = [];

  readonly columns = [
    kgExplorerLinkColumn<Dataset>('Dataset', 'url', { labelProp: 'name' }),
    kgExplorerTextColumn<Dataset>('Organ', 'organ'),
    kgExplorerNumberColumn<Dataset>('#Cells', 'cellCount'),
  ];

  onDownload({ item, format }: KgExplorerDownload<Dataset>): void {
    // Start the download of `item` in `format`.
  }
}
```

Give the explorer a height (for example, fill the page below your header) and apply an AtlasNG theme such as the WPP theme. The theme should follow the user's system color scheme by default.

## Layout

| Area          | Behavior                                                                                                                                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filter menu   | A placeholder for now. Docked on the left from the Angular Material large breakpoint (1280px) up; below that it is a drawer opened and closed through `[(filtersOpen)]`.                                                                                               |
| Results table | Search bar with autocomplete, "Viewing X of Y" counter, and sortable `ang-table`. Below the search bar, an `ang-scroll-area` scrolls the table, the end-of-results indicator that follows it, and any table end content. The no-results indicator replaces empty rows. |
| Padding       | Around the search bar and the table: 16px below 600px, 24px below 960px, and 32px above.                                                                                                                                                                               |

## Data and columns

- `items` takes any row type, and `columns` (required) sets which properties the table shows. There are no built-in default columns.
- Build columns with the generic helpers, which apply the Figma column widths and cell types: `kgExplorerLinkColumn(name, prop, { labelProp | labelFn | label })`, `kgExplorerTextColumn`, `kgExplorerListColumn` (comma-separated arrays, unsortable), `kgExplorerNumberColumn`, and `kgExplorerDateColumn`. Each takes optional `TableColumn` overrides as its last argument, and you can mix in plain `TableColumn` objects. Create the array once and reuse it, because the table caches cell templates by column identity.
- `KG_EXPLORER_SAMPLE_ITEMS` and `KG_EXPLORER_SAMPLE_COLUMNS` (with the `KgExplorerSampleItem` row type) are white-label demo data used by the stories.
- `searchFn` decides which rows match the search term (defaults to matching any string, number, or array value). `searchLabelFn` provides autocomplete suggestions (defaults to the row `title`).
- `downloadFormats` sets the file formats in the per-row download menu (defaults to `FILE_FORMATS` from `@atlasng/design-system/version-control`). Picking a format emits `download` with `{ item, format }`. `DownloadCellDefinition` can also be used on its own in any `ang-table` column.

## Inputs and outputs

| Name                           | Description                                                          |
| ------------------------------ | -------------------------------------------------------------------- |
| `[(search)]`, `[(sorts)]`      | Current search term and column sorts.                                |
| `[(filtersOpen)]`              | Whether the filter drawer is open below the large breakpoint.        |
| `rowHeight`                    | Height of the table rows in pixels (defaults to 96).                 |
| `(download)`, `(clearFilters)` | Download requests, and clear requests from the no-results indicator. |

## Show and hide features

Boolean inputs that default to `true`: `showSearch`, `showResultsCounter`, `showEndOfResults`, and `showDownload`.

## Slots

Project a template to add content, such as a footer, at the end of the table:

```html
<ang-kg-explorer [items]="items" [columns]="columns">
  <ng-template angKgExplorerTableEnd>
    <!-- Footer or other content after the last row -->
  </ng-template>
</ang-kg-explorer>
```

`angKgExplorerTableEnd` content renders after the table and the end-of-results indicator, and scrolls with them.

`KgExplorerResultsTable` is exported too, so you can build your own layout from it. It fills its container's height, so give the container one.

## Known limitations

`ang-table` uses a fixed row height, so long titles are cut off after three lines instead of making the row taller. The table grows to fit all rows inside the scroll area below the search bar, so its column headers scroll out of view.

## Development

| Task      | Command                        |
| --------- | ------------------------------ |
| Build     | `npx nx build kg-explorer`     |
| Test      | `npx nx test kg-explorer`      |
| Lint      | `npx nx lint kg-explorer`      |
| Storybook | `npx nx storybook kg-explorer` |

The Storybook stories under `Applications/KG Explorer` are the white-label demo and link to the Figma design.
