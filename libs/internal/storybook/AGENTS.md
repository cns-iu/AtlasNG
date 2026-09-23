# Internal Storybook Guidance

- This package provides shared Storybook theme, tokens, and style infrastructure for AtlasNG projects.
- Keep it internal to the monorepo; do not treat it as a public app-facing library.
- Prefer additive, backwards-compatible changes to theme tokens, SCSS mixins, and shared story utilities.
- When a visual change affects multiple libraries or stories, update the relevant story and theme usage together.
- Validate changes with `npx nx lint internal-storybook` and relevant Storybook or app-level checks such as `npx nx test kg-explorer` when a theme is consumed there.
