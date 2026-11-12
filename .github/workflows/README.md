# Using these workflows

AtlasNG's reusable workflows (`nx-*.yml` in this directory) run CI, npm publishing, and GitHub Pages deploys of apps and Storybooks for any Nx workspace that uses npm. Each file documents its inputs and secrets in its `on.workflow_call` block. This guide covers the setup around them.

## Pin a version

The workflows and the `deploy-preview` action are released together with two tags:

- `workflows/v<major>` (for example `workflows/v1`) moves to every release with that major version. Pin it to get fixes and new inputs without breaking changes.
- `workflows/v<major>.<minor>.<patch>` (for example `workflows/v1.2.0`) never moves. Pin it, or its commit SHA, for fully reproducible runs.

[GitHub Releases](https://github.com/cns-iu/AtlasNG/releases) tagged `workflows/v*` list the changes in each release. A major version bump marks breaking changes such as removed or renamed inputs and secrets.

## Example caller

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches:
      - main
  pull_request:

permissions:
  actions: read
  contents: read
  pull-requests: write

concurrency:
  group: ${{ github.workflow }}-${{ github.ref_name }}
  cancel-in-progress: true

jobs:
  ci:
    uses: cns-iu/AtlasNG/.github/workflows/nx-ci.yml@workflows/v1
    with:
      targets: lint test build
    secrets:
      NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}
```

AtlasNG's own [ci.yml](ci.yml), [publish.yml](publish.yml), and [storybook-gh-pages.yml](storybook-gh-pages.yml) are complete callers.

## Requirements

| Workflow                                               | Caller permissions                                        | Secrets                                                                          | Status check                                                                 |
| ------------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [nx-ci.yml](nx-ci.yml)                                 | `actions: read`, `contents: read`, `pull-requests: write` | `NX_CLOUD_ACCESS_TOKEN`; `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` for previews | `<caller job> / main`                                                        |
| [nx-release-publish.yml](nx-release-publish.yml)       | `contents: write`, `id-token: write`                      | `NX_CLOUD_ACCESS_TOKEN`                                                          | `<caller job> / Publish`, `<caller job> / Create fixed group GitHub Release` |
| [nx-storybook-gh-pages.yml](nx-storybook-gh-pages.yml) | `contents: write`                                         | `NX_CLOUD_ACCESS_TOKEN`                                                          | `<caller job> / Build and deploy Storybook`                                  |
| [nx-app-gh-pages.yml](nx-app-gh-pages.yml)             | `contents: read`, `pages: write`, `id-token: write`       | `NX_CLOUD_ACCESS_TOKEN`                                                          | `<caller job> / Build app`, `<caller job> / Deploy to GitHub Pages`          |

Pass secrets by name as in the example, or with `secrets: inherit`.

GitHub names a reusable workflow's status check `<caller job> / <called job>`. Name the caller job `ci` for `nx-ci.yml`, as in the example, and require `ci / main` in branch protection or rulesets. Renaming the caller job renames the check and silently breaks those rules.

The caller's repository must provide:

- a Node.js version file, `.nvmrc` by default (`node-version-file` input)
- a `package-lock.json`; dependencies are installed with `npm ci`
- for `nx-ci.yml` with `commitlint: true` (the default), a commitlint configuration
- for `nx-ci.yml` task distribution, `.nx/workflows/distribution-config.yaml`, or a `distribute-on` value; without the default file every task runs on the CI runner
- for `nx-release-publish.yml`, an [Nx Release](https://nx.dev/docs/guides/nx-release) configuration in `nx.json`

## Preview deploys

`nx-ci.yml` deploys Netlify previews for pull requests when `deploy-preview` is `true`. Previews are skipped for pull requests from forks and when `NETLIFY_AUTH_TOKEN` is empty. Set `netlify-filter` when the Netlify site belongs to one package in a monorepo.

### Single-app workspaces

Set `preview-dir` to the app's build output. The workflow deploys it at the root of the preview URL, adds a `_redirects` rewrite to `index.html` for client-side routing, and comments the preview link on the pull request. The app is built with its default configuration and `<base href="/">`, and the preview is skipped when the directory has no `index.html`, for example when the app is not affected.

```yaml
jobs:
  ci:
    uses: cns-iu/AtlasNG/.github/workflows/nx-ci.yml@workflows/v1
    with:
      deploy-preview: true
      preview-dir: dist/apps/my-app/browser
    secrets:
      NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}
      NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
      NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Multi-project workspaces

Without `preview-dir`, `nx-ci.yml` runs `./.github/actions/deploy-preview` from the caller's checkout with the inputs `issue-number`, `commit-sha`, `netlify-auth-token`, `netlify-site-id`, and `netlify-filter`. GitHub resolves local action paths against the caller's repository, so the caller provides this action.

AtlasNG's [deploy-preview](../actions/deploy-preview/action.yml) deploys `dist/apps`, `dist/compodoc`, and `dist/storybook` behind a generated index page. If that layout fits, the caller's action can wrap it:

```yaml
# .github/actions/deploy-preview/action.yml
name: Deploy Preview
description: Deploy a pull request preview with AtlasNG's deploy-preview action.
inputs:
  issue-number:
    required: true
  commit-sha:
    required: true
  netlify-auth-token:
    required: true
  netlify-site-id:
    required: true
  netlify-filter:
    required: false
    default: ''
runs:
  using: composite
  steps:
    - uses: cns-iu/AtlasNG/.github/actions/deploy-preview@workflows/v1
      with:
        issue-number: ${{ inputs.issue-number }}
        commit-sha: ${{ inputs.commit-sha }}
        netlify-auth-token: ${{ inputs.netlify-auth-token }}
        netlify-site-id: ${{ inputs.netlify-site-id }}
        netlify-filter: ${{ inputs.netlify-filter }}
```

Otherwise, write an action with the same inputs that deploys the caller's own build output.

## GitHub Pages apps

`nx-app-gh-pages.yml` builds one app and deploys it with `actions/deploy-pages`. Set the repository's Pages source to GitHub Actions. The workflow copies `index.html` to `404.html` so a client-side router handles deep links, and adds `.nojekyll`. Use `prepare-command` for extra steps in the output directory, such as copying `index.html` to known routes so Pages serves them with a 200 status.

```yaml
name: Deploy

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    uses: cns-iu/AtlasNG/.github/workflows/nx-app-gh-pages.yml@workflows/v1
    with:
      project: my-app
      output-dir: dist/apps/my-app/browser
      prepare-command: cp index.html privacy-policy.html
```

A project site is served from `/<repository>/`, so build it with a matching base href unless the repository is `<owner>.github.io` or uses a custom domain.
