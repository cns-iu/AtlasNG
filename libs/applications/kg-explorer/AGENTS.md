# Knowledge Graph Explorer Guidance

- `@atlasng/kg-explorer` is an application library that builds the knowledge-graph explorer experience and may consume shared Angular, design-system, and storybook infrastructure.
- Its `layer:app-library` tag limits imports to the published libraries (`labs` and below). Only `.storybook/` configuration may import `@atlasng/internal/storybook`.
- Keep the public API additive and avoid breaking changes unless explicitly requested.
- When changing behavior, update the relevant unit tests and stories in the same feature area.
- Prefer reusing design-system primitives and internal Storybook theme tokens instead of introducing ad hoc styling.
- Validate with `npx nx test kg-explorer` and `npx nx lint kg-explorer`.

## Metadata Page

- `ang-metadata-page` (`src/lib/metadata-page/`) renders the page body only. Do not add header or footer shells to it; consuming apps compose them around it.
- Section content is a list of content-block nodes rendered with `ang-content-block`, not markdown or HTML. The page provides the design-system definitions (for example `ContentParagraph` and `TextLink`) plus `METADATA_PAGE_DEFINITIONS` from `content/definitions.ts` (`MetadataImage`, `MetadataChips`). To add a page-specific content type, add its component under `content/`, export a `*_DEFINITION` from `content/definitions.ts`, add it to `METADATA_PAGE_DEFINITIONS`, and cover it in the spec.
- The version control panel is always visible; do not add a toggle for it. New optional parts get a `*Disabled` boolean input that defaults to `false`, and are also hidden when their data is empty.
- The page never performs downloads; it re-emits `download` from `ang-version-control`. Stories do not show download behavior.
- The version control panel is placed after the first section in DOM order and moved to a side column with CSS grid from the `medium` breakpoint. Keep that DOM order so the mobile reading order matches the design.
- `ng-package.json` includes only the design-system Sass path, for the `breakpoints` mixin and `internal/token-utils`. Do not add the labs Sass path there: labs has an older `internal/token-utils` that would shadow the design-system copy. Storybook's `includePaths` in `project.json` still includes labs for the header shell.
- Page spacing is set with tokens in `src/sass/tokens/_metadata-page.scss`, not ad hoc CSS variables. Add new tokens there and read them with `token-utils.slot(...)`; use `token-utils.sys-slot(...)` rather than hard-coded `var(--mat-sys-*)`.
