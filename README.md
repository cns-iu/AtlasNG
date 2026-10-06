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

## Releasing

Packages are released with [Nx Release](https://nx.dev/docs/guides/nx-release) in two release groups configured in [nx.json](nx.json):

| Group          | Projects                                                      | Versioning                 | Git tag               |
| -------------- | ------------------------------------------------------------- | -------------------------- | --------------------- |
| `libraries`    | `core`, `common`, `cdk`, `analytics`, `design-system`, `labs` | Fixed (one shared version) | `v<version>`          |
| `applications` | `libs/applications/*` (for example `kg-explorer`)             | Independent                | `<project>@<version>` |

Until 1.0.0, every release is a patch release:

```sh
npx nx release patch --skip-publish --dry-run  # preview versions, changelogs, and tags
npx nx release patch --skip-publish

# Release a single group or project
npx nx release patch --skip-publish --groups=libraries
npx nx release patch --skip-publish --projects=kg-explorer
```

This bumps versions, prepends to each project's `CHANGELOG.md`, commits, and tags. Push the release commit and tags yourself (`git push origin main <tags>`); releases that include an application library push automatically, because Nx needs the tag on GitHub to create GitHub Releases for application libraries (requires `GITHUB_TOKEN`, `GH_TOKEN`, or a `gh auth login` session). Each pushed tag triggers the [publish workflow](.github/workflows/publish.yml), which publishes the tagged group or project to npm with trusted publishing; for `v<version>` tags it also creates one combined GitHub Release for the `libraries` group. If more than three tags are pushed at once, GitHub does not trigger tag workflows; run the publish workflow manually on each tag instead.

### New packages

npm trusted publishing can only be configured for packages that already exist on the registry. After adding a release project (for example a new application library), publish it once from your machine and configure trusted publishing for it:

```sh
npm login
node tools/scripts/bootstrap-npm-packages.mjs --dry-run  # list what would be bootstrapped
node tools/scripts/bootstrap-npm-packages.mjs
```

The script only touches packages that are not on npm yet, so it is safe to rerun.

## Contributing

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) with a project name as the scope (for example `feat(design-system): add notice component`). The allowed scopes are listed in [commitlint.config.mjs](commitlint.config.mjs). See [AGENTS.md](AGENTS.md) for the full workspace conventions.

## License

[MIT](LICENSE)
