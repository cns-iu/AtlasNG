# AtlasNG

An Angular monorepo of libraries for building consistent, accessible, and analytics-aware applications.

Browse the components in the [AtlasNG Storybook](https://cns-iu.github.io/AtlasNG/).

## Packages

| Package                                                           | Description                                                                   |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [`@atlasng/core`](libs/core/README.md)                            | Foundation layer: application-wide configuration, DI tokens, and providers    |
| [`@atlasng/common`](libs/common/README.md)                        | Reusable directives, services, and utilities shared across libraries and apps |
| [`@atlasng/cdk`](libs/cdk/README.md)                              | Low-level infrastructure for component authors                                |
| [`@atlasng/analytics`](libs/analytics/README.md)                  | Consent-aware event tracking and permission management                        |
| [`@atlasng/design-system`](libs/design-system/README.md)          | Angular Material–based components and Sass theming utilities                  |
| [`@atlasng/labs`](libs/labs/README.md)                            | Experimental components without a stable API                                  |
| [`@atlasng/kg-explorer`](libs/applications/kg-explorer/README.md) | Knowledge graph explorer application library                                  |

## Development

### Prerequisites

- Node.js 24 or later (see [.nvmrc](.nvmrc))
- npm 10 or later

### Install dependencies

```sh
npm install
```

### Common tasks

```sh
# Serve the demo application
npx nx serve AtlasNG

# Build, test, or lint everything
npx nx run-many -t build
npx nx run-many -t test
npx nx run-many -t lint

# Or target one project
npx nx build analytics
npx nx test analytics

# Only projects affected by your changes
npx nx affected -t lint,test,build
```

Unit tests run with Vitest and enforce 85% coverage thresholds.

### Storybook

```sh
# All Storybooks combined (design-system, labs, kg-explorer)
npx nx storybook internal-storybook

# A single library
npx nx storybook design-system
```

See [libs/internal/storybook](libs/internal/storybook/README.md) for local ports.

### API docs

```sh
npx nx compodoc <project>        # live
npx nx build-compodoc <project>  # static
```

## Contributing

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) with a project name as the scope (for example `feat(design-system): add notice component`). The allowed scopes are listed in [commitlint.config.mjs](commitlint.config.mjs). See [AGENTS.md](AGENTS.md) for the full workspace conventions.

## License

[MIT](LICENSE)
