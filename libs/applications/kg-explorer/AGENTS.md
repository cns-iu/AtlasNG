# Knowledge Graph Explorer Guidance

- `@atlasng/kg-explorer` is an application library that builds the knowledge-graph explorer experience and may consume shared Angular, design-system, and storybook infrastructure.
- Its `layer:app-library` tag limits imports to the published libraries (`labs` and below). Only `.storybook/` configuration may import `@atlasng/internal/storybook`.
- Keep the public API additive and avoid breaking changes unless explicitly requested.
- When changing behavior, update the relevant unit tests and stories in the same feature area.
- Prefer reusing design-system primitives and internal Storybook theme tokens instead of introducing ad hoc styling.
- Validate with `npx nx test kg-explorer` and `npx nx lint kg-explorer`.

## Metadata Page

- `ang-metadata-page` (`src/lib/metadata-page/`) renders the page body only. Do not add header or footer shells to it; consuming apps compose them around it.
- Section content is structured data (`MetadataBlock`: `text`, `image`, `chips`), not markdown or HTML. Add a new block type to the `MetadataBlock` union and the template `@switch` together, and cover it in the spec.
- The version control panel is always visible; do not add a toggle for it. New optional parts get a `show*` boolean input that defaults to `true`, and are also hidden when their data is empty.
- The page never performs downloads; it re-emits `download` from `ang-version-control`. Stories do not show download behavior.
- The version control panel is placed after the first section in DOM order and moved to a side column with CSS grid from the `medium` breakpoint. Keep that DOM order so the mobile reading order matches the design.
- `ng-package.json` includes the design-system Sass path for the `breakpoints` mixin.
