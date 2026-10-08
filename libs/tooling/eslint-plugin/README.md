# @atlasng/eslint-plugin

Shared ESLint flat configurations for AtlasNG and other Nx Angular workspaces. The plugin has the same shape as [`@nx/eslint-plugin`](https://nx.dev/nx-api/eslint-plugin): each configuration wraps the Nx configuration of the same name and adds the AtlasNG rules.

## Installation

```bash
npm install --save-dev @atlasng/eslint-plugin @nx/eslint-plugin eslint eslint-config-prettier typescript-eslint eslint-plugin-jsonc
```

`eslint-config-prettier` is required: `@nx/eslint-plugin` detects it from the workspace and uses it to turn off rules that conflict with Prettier. Install the optional peers for the configurations you use:

- `angular-eslint` for `flat/angular` and `flat/angular-template`
- `eslint-plugin-storybook` for `flat/storybook`

## Configurations

| Key                     | Contents                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `flat/base`             | Nx `flat/base`, JSON parsing, `dist`/`out-tsc` ignores, and `@nx/dependency-checks` for `package.json` files |
| `flat/javascript`       | Nx `flat/javascript` and the core rules (`curly`, `eqeqeq`, `max-depth`, …)                                  |
| `flat/typescript`       | Nx `flat/typescript`, the core rules, and their TypeScript counterparts                                      |
| `flat/angular`          | Nx `flat/angular`, additional angular-eslint rules, and selector type and style checks without a prefix      |
| `flat/angular-template` | Nx `flat/angular-template` and additional template rules                                                     |
| `flat/storybook`        | `eslint-plugin-storybook` `flat/recommended`, with the `.storybook` directory unignored                      |

Every configuration except `flat/base` is loaded lazily, so a workspace only needs the packages for the configurations it reads.

## Usage

In the root `eslint.config.mjs`, spread the configurations, then add the workspace's selector prefix and module boundaries:

```js
import atlasng from '@atlasng/eslint-plugin';

export default [
  ...atlasng.configs['flat/base'],
  ...atlasng.configs['flat/javascript'],
  ...atlasng.configs['flat/typescript'],
  ...atlasng.configs['flat/angular'],
  ...atlasng.configs['flat/angular-template'],
  ...atlasng.configs['flat/storybook'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': ['error', { type: 'element', style: 'kebab-case', prefix: 'app' }],
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', style: 'camelCase', prefix: 'app' }],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          depConstraints: [{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }],
        },
      ],
    },
  },
];
```

The selector rules in `flat/angular` set an empty prefix, which disables the prefix check. Redeclare them with your own prefix as shown above.

### Subpath exports

Like `@nx/eslint-plugin`, the package also exposes entry points that load only one group of configurations:

```js
import angular from '@atlasng/eslint-plugin/angular';
import typescript from '@atlasng/eslint-plugin/typescript';

export default [
  ...typescript.configs.javascript,
  ...typescript.configs.typescript,
  ...angular.configs.angular,
  ...angular.configs['angular-template'],
];
```
