# @atlasng/nx-plugin

[Nx](https://nx.dev/) plugin for AtlasNG and other Nx Angular workspaces. It sets up the shared tooling packages, infers Compodoc targets, provides release executors and ships an `nx.json` preset.

## Installation

```bash
npx nx add @atlasng/nx-plugin
```

`nx add` installs the plugin and runs its [`init` generator](#init-generator).

## Init generator

`npx nx g @atlasng/nx-plugin:init` sets up a new or existing workspace:

- adds `@atlasng/eslint-plugin`, `@atlasng/prettier-config`, `@atlasng/commitlint-config` and `@atlasng/tsconfig` as devDependencies, using the version ranges in the plugin's own optional `peerDependencies` (`nx release` keeps them in step with the released config packages)
- writes a thin root `eslint.config.mjs` built on the `@atlasng/eslint-plugin` configs, with the Angular selector prefix and an `@nx/enforce-module-boundaries` block to adjust
- sets the `prettier` key in `package.json` to `@atlasng/prettier-config` (a default Nx `.prettierrc` that only sets `singleQuote` is removed)
- writes `commitlint.config.mjs` extending `@atlasng`
- makes `tsconfig.base.json` extend `@atlasng/tsconfig/angular.json` (or `node.json` with `--tsconfigPreset=node`)
- registers the plugin in `nx.json`
- registers the [sync generator](#sync-generator) under `sync.globalGenerators` (storing `--prefix` in its options) and runs it

It never overwrites existing custom configuration: an existing ESLint, Prettier or commitlint config, or a different `extends` in `tsconfig.base.json`, is kept and a warning explains what to change by hand. Running it again changes nothing.

| Option            | Default                                  | Description                                      |
| ----------------- | ---------------------------------------- | ------------------------------------------------ |
| `prefix`          | the `nx.json` generator prefix, or `app` | Angular selector prefix for the ESLint rules     |
| `tsconfigPreset`  | `angular`                                | The `@atlasng/tsconfig` preset to extend         |
| `skipPackageJson` | `false`                                  | Do not add the config packages to `package.json` |
| `skipFormat`      | `false`                                  | Do not format the changed files                  |

## Sync generator

`@atlasng/nx-plugin:sync` is a global [sync generator](https://nx.dev/concepts/sync-generators) that keeps the files every workspace shares up to date. `init` registers it; to add it by hand:

```json
{
  "sync": {
    "globalGenerators": ["@atlasng/nx-plugin:sync"],
    "generatorOptions": {
      "@atlasng/nx-plugin:sync": {
        "prefix": "ang",
        "extraScopes": ["release"],
        "exclude": []
      }
    }
  }
}
```

`npx nx sync` applies the changes and `npx nx sync:check` fails when a managed file has drifted, which makes it a good CI step.

| Option        | Default                                  | Description                                                                          |
| ------------- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| `prefix`      | the `nx.json` generator prefix, or `app` | Angular selector prefix used in the managed files and the Angular generator defaults |
| `extraScopes` | `[]`                                     | Commit scopes added to the project names in `conventionalCommits.scopes`             |
| `exclude`     | `[]`                                     | Managed-file ids or paths to leave alone; a directory skips everything below it      |

| Id                     | File                                           | Strategy                                                                                                                                    |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `editorconfig`         | `.editorconfig`                                | Whole file                                                                                                                                  |
| `gitattributes`        | `.gitattributes`                               | Whole file                                                                                                                                  |
| `nvmrc`                | `.nvmrc`                                       | Whole file                                                                                                                                  |
| `husky-commit-msg`     | `.husky/commit-msg`                            | Whole file, executable                                                                                                                      |
| `husky-pre-commit`     | `.husky/pre-commit`                            | Whole file, executable                                                                                                                      |
| `testing-instructions` | `.github/instructions/testing.instructions.md` | Whole file                                                                                                                                  |
| `angular-instructions` | `.github/instructions/angular.instructions.md` | Whole file with the prefix filled in                                                                                                        |
| `skills`               | `.agents/skills/atlasng-*`                     | Whole files; `atlasng-*` skills and files the plugin no longer ships are removed. Other skills, such as the Nx ones, are never touched      |
| `vscode-extensions`    | `.vscode/extensions.json`                      | JSON merge: union of `recommendations`                                                                                                      |
| `vscode-settings`      | `.vscode/settings.json`                        | JSON merge: Nx Console generator allow and block lists; `conventionalCommits.scopes` is set to the sorted project names plus `extraScopes`  |
| `mcp`                  | `.mcp.json`                                    | JSON merge: the `angular-cli` MCP server                                                                                                    |
| `claude-settings`      | `.claude/settings.json`                        | JSON merge: the Nx Claude Code marketplace and plugin                                                                                       |
| `nx-json`              | `nx.json`                                      | JSON merge: `namedInputs`, `targetDefaults` and `generators` from [`presets/nx.json`](#nx-preset), plus `prefix` for the Angular generators |
| `agents-md`            | `AGENTS.md`                                    | Marker block between `<!-- atlasng configuration start -->` and `<!-- atlasng configuration end -->`, appended when missing                 |

A JSON merge keeps every local key. Objects are merged key by key, arrays get the missing shared entries appended and other shared values replace local ones. A file is only rewritten when its parsed value changes, so comments survive a run with nothing to do. Removing a shared entry from every workspace therefore needs a migration.

Nx caches sync results in the daemon and does not see a file mode change on its own. If only the executable bit of a hook was lost, run `NX_DAEMON=false npx nx sync`.

## Inferred Compodoc targets

When the plugin is registered in `nx.json`, every project with an `ng-package.json`, a `tsconfig.lib.json` and a `project.json` or `package.json` gets two targets:

| Target           | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| `build-compodoc` | Builds the static API docs to `dist/compodoc/<project>` (cached) |
| `compodoc`       | Serves the API docs and rebuilds them on change (continuous)     |

Projects that also have a `.storybook` directory get a third target:

| Target                     | Description                                                                     |
| -------------------------- | ------------------------------------------------------------------------------- |
| `build-storybook-compodoc` | Builds the Compodoc JSON that Storybook reads to `.storybook/compodoc` (cached) |

ng-packagr secondary entry points are skipped. The targets run `npx compodoc`, so the workspace needs `@compodoc/compodoc` installed. The target names are options:

```json
{
  "plugins": [
    {
      "plugin": "@atlasng/nx-plugin",
      "options": {
        "buildCompodocTargetName": "build-compodoc",
        "compodocTargetName": "compodoc",
        "buildStorybookCompodocTargetName": "build-storybook-compodoc"
      }
    }
  ]
}
```

## Executors

### `release-notes`

Combines the `CHANGELOG.md` sections of a fixed release group into one set of GitHub release notes. Projects whose section only records a version bump are left out. The group's projects come from `nx.json` and may be names, globs, directories or tags.

| Option   | Default     | Description                                                                         |
| -------- | ----------- | ----------------------------------------------------------------------------------- |
| `group`  | `libraries` | Release group name in `nx.json`                                                     |
| `tag`    | (required)  | Release tag, for example `v1.2.3`; the version is read with the group's tag pattern |
| `output` |             | File to write the notes to, relative to the workspace root                          |

```json
{
  "targets": {
    "release-notes": {
      "executor": "@atlasng/nx-plugin:release-notes",
      "options": { "group": "libraries" }
    }
  }
}
```

Use `--output` in CI: without it the notes go to stdout, mixed with the Nx task header and summary.

```bash
npx nx run @atlasng/monorepo:release-notes --tag=v1.2.3 --output=tmp/release-notes.md
gh release create v1.2.3 --notes-file tmp/release-notes.md
```

### `bootstrap-npm-packages`

npm trusted publishing can only be configured for packages that already exist on the registry. This executor builds every project with an `nx-release-publish` target that is not on npm yet, publishes each one with `npm publish` (dependencies first, attached to the terminal so npm can wait for two-factor authentication), then runs `npm trust github` so later releases can be published from CI. It is safe to rerun.

| Option       | Default             | Description                                         |
| ------------ | ------------------- | --------------------------------------------------- |
| `repository` | the `origin` remote | GitHub repository (`owner/name`) allowed to publish |
| `workflow`   | `publish.yml`       | Workflow file that publishes the packages           |
| `dryRun`     | `false`             | Only print the commands that would run              |

```bash
npm login
npx nx run @atlasng/monorepo:bootstrap-npm-packages --dryRun
npx nx run @atlasng/monorepo:bootstrap-npm-packages
```

## Nx preset

`presets/nx.json` holds the shared `namedInputs`, `targetDefaults` and `generators` defaults (without a selector prefix). It is **not** meant to be used through `nx.json` `"extends"`.

Nx merges an extended `nx.json` with a shallow, top-level spread (`{ ...preset, ...nxJson }`), which was confirmed with Nx 23.2:

- a top-level key present in both files, such as `targetDefaults`, `namedInputs`, `generators` or `plugins`, is taken entirely from the local `nx.json`; nothing from the preset's copy survives, not even entries the local file does not mention
- a key only in the preset is used as is
- `updateNxJson` in generators writes back every top-level key that differs from the preset, so the first generator that adds a target default copies the whole preset key into the local file

Every real workspace needs local `targetDefaults`, `namedInputs` and `generators`, so `extends` would drop the preset's values. The [sync generator](#sync-generator) merges these keys into `nx.json` instead.

## Migrations

`migrations.json` is registered through `nx-migrations` in `package.json`, so breaking changes can ship as migrations that run with `npx nx migrate @atlasng/nx-plugin@latest`. There are none yet.
