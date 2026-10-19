# @atlasng/commitlint-config

Shared [commitlint](https://commitlint.js.org/) configuration for AtlasNG and other Nx workspaces. It enforces [Conventional Commits](https://www.conventionalcommits.org/) and only accepts scopes that are Nx project names.

## Installation

```bash
npm install --save-dev @commitlint/cli @atlasng/commitlint-config
```

## Usage

Extend the configuration from `commitlint.config.mjs`:

```js
export default {
  extends: ['@atlasng'],
};
```

The configuration:

- extends `@commitlint/config-conventional`
- restricts `scope-enum` to the workspace's Nx project names (`@org/name` becomes `name`), or allows no scopes when the directory has no `nx.json`
- ignores commits created by Nx Cloud self-healing CI reruns

### Additional scopes

No scopes beyond the project names are allowed by default. Use `utils.getProjects` to add your own, for example a `release` scope for `nx release` commits:

```js
import atlasng from '@atlasng/commitlint-config';

export default {
  extends: ['@atlasng'],
  rules: {
    'scope-enum': async (ctx) => [2, 'always', [...atlasng.utils.getProjects(ctx), 'release']],
  },
};
```

### Selecting projects

`utils.getProjects(ctx, selector)` accepts an optional selector that receives each project's `name`, `projectType` and `tags`:

```js
import atlasng from '@atlasng/commitlint-config';

export default {
  extends: ['@atlasng'],
  rules: {
    'scope-enum': async (ctx) => [
      2,
      'always',
      atlasng.utils.getProjects(ctx, ({ tags }) => !tags?.includes('internal')),
    ],
  },
};
```

`utils.isNxSelfHealingCommit(message)` is also exported for configurations that replace `ignores`.
