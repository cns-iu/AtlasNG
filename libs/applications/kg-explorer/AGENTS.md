# Knowledge Graph Explorer Guidance

- `@atlasng/kg-explorer` is an application library that builds the knowledge-graph explorer experience and may consume shared Angular, design-system, and storybook infrastructure.
- Its `layer:app-library` tag limits imports to the published libraries (`labs` and below). Only `.storybook/` configuration may import `@atlasng/internal/storybook`.
- Keep the public API additive and avoid breaking changes unless explicitly requested.
- When changing behavior, update the relevant unit tests and stories in the same feature area.
- Prefer reusing design-system primitives and internal Storybook theme tokens instead of introducing ad hoc styling.
- Validate with `npx nx test kg-explorer` and `npx nx lint kg-explorer`.

## Component Map

- `kg-explorer/`: `KgExplorer` (`ang-kg-explorer`) is the root. It holds the `mat-sidenav` layout and breakpoint handling, adds the download column, and passes inputs to the children.
- `filter-menu-placeholder/`: `KgExplorerFilterMenuPlaceholder` stands in for the filter menu inside the sidenav until the filter form component exists; replace it there.
- `results-table/`: `KgExplorerResultsTable` fills its container's height and holds the search with autocomplete, the results counter, `ang-table`, the end-of-results and no-results indicators, and the `angKgExplorerTableEnd` slot rendered after the table. The table, indicator, and slot share an `ang-scroll-area` below the search bar.
- `download-cell/`: `DownloadCellDefinition` is an `ang-table` cell definition with the "Choose download format" tooltip and a `mat-menu` of `VersionControlFileFormat`s.
- `columns.ts` (generic column builders with Figma widths; consumers define their own columns), `models.ts` (public types), `slots.ts` (`ng-template` slot directives), and `sample-data.ts` (white-label demo rows and columns).

## Conventions

- Add customization as boolean `show*` inputs (default `true`) or `ng-template` slots, and pass new results-table inputs through the root.
- Column arrays must keep a stable identity (`computed` or module constants), because `ang-table` caches cell definitions per column object.
- The SCSS uses `--mat-sys-*` tokens and plain media queries at the Angular Material breakpoints (600, 960, and 1280px). `ng-package.json` adds the design-system sass include path that design-system sources need in tests.
- Figma: `https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=8695-21`.
