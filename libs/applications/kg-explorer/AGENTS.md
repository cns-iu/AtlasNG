# Knowledge Graph Explorer Guidance

- `@atlasng/kg-explorer` is an application library that builds the knowledge-graph explorer experience and may consume shared Angular, design-system, and storybook infrastructure.
- Its `layer:app-library` tag limits imports to the published libraries (`labs` and below). Only `.storybook/` configuration may import `@atlasng/internal/storybook`.
- Keep the public API additive and avoid breaking changes unless explicitly requested.
- When changing behavior, update the relevant unit tests and stories in the same feature area.
- Prefer reusing design-system primitives and internal Storybook theme tokens instead of introducing ad hoc styling.
- Validate with `npx nx test kg-explorer` and `npx nx lint kg-explorer`.

## Component Map

- `table-view/`: `KgExplorerTableView` (`ang-kg-explorer-table-view`) is the root. It holds the `mat-sidenav` layout (docked from the `large` breakpoint via `watchBreakpoint`), one `ang-multi-select-filter` per filter, resolves its `config` input over `KG_EXPLORER_TABLE_VIEW_CONFIG`, adds the download column when `downloadFormats` is set, and passes inputs and its projected content to the results table.
- `results-table/` (internal): `KgExplorerResultsTable` fills its container's height and holds the results navigation, `ang-table`, the end-of-results and no-results indicators, and projected content after the table, all in one `ang-scroll-area`. It searches the rows with `injectSearch` from `@atlasng/cdk/search`.
- `results-navigation/` (internal): `KgExplorerResultsNavigation` is the presentational `ang-search-field` and the "Viewing X of Y" counter. `KgExplorerResultsTable` passes in the suggestions and counts.
- `download-cell/`: `KgExplorerDownloadCellDefinition` is an `ang-table` cell definition whose button opens a `mat-menu` of formats, downloads a single format directly, or is disabled for a row without formats.
- `config.ts` (`KgExplorerTableViewConfig`, `KG_EXPLORER_TABLE_VIEW_CONFIG`, `provideKgExplorerTableView`), `columns.ts` (generic column builders with Figma widths; consumers define their own columns), `models.ts` (public types), and `sample-data.ts` (internal white-label demo rows, columns, and filters for stories and tests).

## Conventions

- `src/index.ts` lists every public export by name; do not use `export *`. Internal components and the sample data stay out of it.
- Add setup options to `KgExplorerTableViewConfig` (with a default in `KG_EXPLORER_TABLE_VIEW_CONFIG` when they have one) rather than as new inputs, and pass new results-table inputs through the root.
- `results-table/` must not import from `table-view/`: `table-view.ts` imports the results table, so the reverse import is circular and fails at startup ("can't access lexical declaration before initialization").
- Column arrays must keep a stable identity (`computed` or module constants), because `ang-table` caches cell definitions per column object.
- Name CSS classes `ang-<component>--<class>` with the component's own root, for example `ang-kg-explorer-download-cell--menu` and `ang-kg-explorer-results-navigation--search`.
- The SCSS reads theme values with `token-utils.sys-slot(...)` rather than hard-coded `var(--mat-sys-*)`, and uses plain media queries at the Angular Material breakpoints (600, 960, and 1280px).
- `ng-package.json` includes only the design-system Sass path. Do not add the labs path: labs has an older `internal/token-utils` that would shadow the design-system copy.
- Figma: `https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=8695-21`.
