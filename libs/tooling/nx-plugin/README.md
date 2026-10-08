# @atlasng/nx-plugin

[Nx](https://nx.dev/) plugin for AtlasNG and other Nx Angular workspaces. It sets up the shared tooling packages, infers Compodoc targets, provides release executors and ships an `nx.json` preset.

## Installation

```bash
npx nx add @atlasng/nx-plugin
```

## Inferred Compodoc targets

When the plugin is registered in `nx.json`, every project with an `ng-package.json`, a `tsconfig.lib.json` and a `project.json` or `package.json` gets two targets:

| Target           | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| `build-compodoc` | Builds the static API docs to `dist/compodoc/<project>` (cached) |
| `compodoc`       | Serves the API docs and rebuilds them on change (continuous)     |

ng-packagr secondary entry points are skipped. The targets run `npx compodoc`, so the workspace needs `@compodoc/compodoc` installed. The target names are options:

```json
{
  "plugins": [
    {
      "plugin": "@atlasng/nx-plugin",
      "options": {
        "buildCompodocTargetName": "build-compodoc",
        "compodocTargetName": "compodoc"
      }
    }
  ]
}
```

## Nx preset

`presets/nx.json` holds the shared `namedInputs`, `targetDefaults` and `generators` defaults (without a selector prefix). It is **not** meant to be used through `nx.json` `"extends"`.

Nx merges an extended `nx.json` with a shallow, top-level spread (`{ ...preset, ...nxJson }`), which was confirmed with Nx 23.2:

- a top-level key present in both files, such as `targetDefaults`, `namedInputs`, `generators` or `plugins`, is taken entirely from the local `nx.json`; nothing from the preset's copy survives, not even entries the local file does not mention
- a key only in the preset is used as is
- `updateNxJson` in generators writes back every top-level key that differs from the preset, so the first generator that adds a target default copies the whole preset key into the local file

Every real workspace needs local `targetDefaults`, `namedInputs` and `generators`, so `extends` would drop the preset's values. The planned `@atlasng/nx-plugin:sync` generator will write these keys into `nx.json` instead.

## Migrations

`migrations.json` is registered through `nx-migrations` in `package.json`, so breaking changes can ship as migrations that run with `npx nx migrate @atlasng/nx-plugin@latest`. There are none yet.
