# AtlasNG

An Angular monorepo of libraries for building consistent, accessible, and analytics-aware applications.

Browse the components in the [AtlasNG Storybook](https://cns-iu.github.io/AtlasNG/).

## Packages

| Package                                                                  | Description                                                                   |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| [`@atlasng/core`](libs/core/README.md)                                   | Foundation layer: application-wide configuration, DI tokens, and providers    |
| [`@atlasng/common`](libs/common/README.md)                               | Reusable directives, services, and utilities shared across libraries and apps |
| [`@atlasng/cdk`](libs/cdk/README.md)                                     | Low-level infrastructure for component authors                                |
| [`@atlasng/analytics`](libs/analytics/README.md)                         | Consent-aware event tracking and permission management                        |
| [`@atlasng/design-system`](libs/design-system/README.md)                 | Angular Material–based components and Sass theming utilities                  |
| [`@atlasng/labs`](libs/labs/README.md)                                   | Experimental components without a stable API                                  |
| [`@atlasng/kg-explorer`](libs/applications/kg-explorer/README.md)        | Knowledge graph explorer application library                                  |
| [`@atlasng/nx-plugin`](libs/tooling/nx-plugin/README.md)                 | Nx plugin with shared generators, executors, inferred targets, and presets    |
| [`@atlasng/eslint-plugin`](libs/tooling/eslint-plugin/README.md)         | Shared ESLint flat configurations                                             |
| [`@atlasng/commitlint-config`](libs/tooling/commitlint-config/README.md) | Shared commitlint configuration with Nx project scopes                        |
| [`@atlasng/prettier-config`](libs/tooling/prettier-config/README.md)     | Shared Prettier configuration                                                 |
| [`@atlasng/tsconfig`](libs/tooling/tsconfig/README.md)                   | Shared TypeScript configurations                                              |

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

## Continuous integration

CI, publishing, and the Storybook deploy run through reusable workflows (prefixed `nx-`) that other Nx repos can call. AtlasNG's own [ci.yml](.github/workflows/ci.yml), [publish.yml](.github/workflows/publish.yml), and [storybook-gh-pages.yml](.github/workflows/storybook-gh-pages.yml) are thin callers, so every AtlasNG PR exercises them.

| Workflow or action                                                                     | Purpose                                                                                               |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [nx-ci.yml](.github/workflows/nx-ci.yml)                                               | commitlint, `nx format:check`, `nx affected` with Nx Cloud distribution, `nx fix-ci`, Netlify preview |
| [nx-release-publish.yml](.github/workflows/nx-release-publish.yml)                     | Publishes the tagged release group or project to npm and creates the fixed group's GitHub Release     |
| [nx-storybook-gh-pages.yml](.github/workflows/nx-storybook-gh-pages.yml)               | Builds a Storybook project and deploys it to GitHub Pages                                             |
| [setup-nx-workspace](.github/actions/setup-nx-workspace/action.yml) (composite action) | Node.js from `.nvmrc`, `npm ci --no-audit`, optional `nx-set-shas`                                    |

Each file documents its inputs and secrets. A caller owns the triggers, `concurrency`, and `permissions`, for example:

```yaml
jobs:
  ci:
    uses: cns-iu/AtlasNG/.github/workflows/nx-ci.yml@workflows/v1
    with:
      targets: lint test build
    secrets:
      NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}
```

The workflows still reference their actions with local `./.github/actions/...` paths, which resolve against the calling repository, so callers outside AtlasNG need their own copies of those actions for now.

### Versions

The reusable workflows and composite actions are released together, independently of the npm packages, with two tags:

- `workflows/v<major>` (for example `workflows/v1`) moves to every release with that major version. Pin it to get fixes and new inputs without breaking changes.
- `workflows/v<major>.<minor>.<patch>` (for example `workflows/v1.2.0`) never moves. Pin it, or its commit SHA, for fully reproducible runs.

Pin actions the same way, for example `uses: cns-iu/AtlasNG/.github/actions/setup-nx-workspace@workflows/v1`. Each release has a [GitHub Release](https://github.com/cns-iu/AtlasNG/releases) listing the commits that touched the workflows and actions since the previous one; a major version bump marks breaking changes such as removed or renamed inputs and secrets.

To cut a release, run the [Release workflows](.github/workflows/release-workflows.yml) workflow on `main` with the new version (enable `dry-run` to preview the notes first). It tags `main`, moves the major tag, and creates the GitHub Release. It refuses versions that are not greater than the latest release, releases without workflow or action changes, and breaking changes (`type!:` or a `BREAKING CHANGE` footer) without a major version bump from 1.0.0 on.

## Releasing

Packages are released with [Nx Release](https://nx.dev/docs/guides/nx-release) in three release groups configured in [nx.json](nx.json):

| Group          | Projects                                                      | Versioning                 | Git tag               |
| -------------- | ------------------------------------------------------------- | -------------------------- | --------------------- |
| `libraries`    | `core`, `common`, `cdk`, `analytics`, `design-system`, `labs` | Fixed (one shared version) | `v<version>`          |
| `applications` | `libs/applications/*` (for example `kg-explorer`)             | Independent                | `<project>@<version>` |
| `tooling`      | `libs/tooling/*` (for example `nx-plugin`)                    | Independent                | `<project>@<version>` |

Until 1.0.0, every release is a patch release:

```sh
npx nx release patch --skip-publish --dry-run  # preview versions, changelogs, and tags
npx nx release patch --skip-publish

# Release a single group or project
npx nx release patch --skip-publish --groups=libraries
npx nx release patch --skip-publish --projects=kg-explorer
```

This bumps versions, prepends to each project's `CHANGELOG.md`, commits, and tags. Push the release commit and tags yourself (`git push origin main <tags>`); releases that include an application or tooling library push automatically, because Nx needs the tag on GitHub to create GitHub Releases for independently versioned projects (requires `GITHUB_TOKEN`, `GH_TOKEN`, or a `gh auth login` session). Each pushed tag triggers the [publish workflow](.github/workflows/publish.yml) (a caller of [nx-release-publish.yml](.github/workflows/nx-release-publish.yml)), which publishes the tagged group or project to npm with trusted publishing; for `v<version>` tags it also creates one combined GitHub Release for the `libraries` group, with notes from `npx nx run @atlasng/monorepo:release-notes --tag=v<version> --output=<file>`. If more than three tags are pushed at once, GitHub does not trigger tag workflows; run the publish workflow manually on each tag instead.

### New packages

npm trusted publishing can only be configured for packages that already exist on the registry. After adding a release project (for example a new application library), publish it once from your machine and configure trusted publishing for it:

```sh
npm login
npx nx run @atlasng/monorepo:bootstrap-npm-packages --dryRun  # list what would be bootstrapped
npx nx run @atlasng/monorepo:bootstrap-npm-packages
```

The [`bootstrap-npm-packages` executor](libs/tooling/nx-plugin/README.md#bootstrap-npm-packages) only touches packages that are not on npm yet. If `npm publish` succeeds but `npm trust` fails, a rerun skips that package, so run `npm trust github` for it manually.

npm expires a new trusted publishing configuration unless the package is published from CI within 48 hours, so release each bootstrapped package right away.

## Contributing

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) with a project name as the scope (for example `feat(design-system): add notice component`). The allowed scopes are listed in [commitlint.config.mjs](commitlint.config.mjs). See [AGENTS.md](AGENTS.md) for the full workspace conventions.

## License

[MIT](LICENSE)
