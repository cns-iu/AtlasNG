import atlasng from '@atlasng/eslint-plugin';

/**
 * Base ESLint configuration for the entire monorepo.
 * Includes rules for JavaScript and TypeScript, and the workspace's module boundaries.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const baseConfig = [
  ...atlasng.configs['flat/base'],
  ...atlasng.configs['flat/javascript'],
  ...atlasng.configs['flat/typescript'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'layer:core',
              onlyDependOnLibsWithTags: [],
            },
            {
              sourceTag: 'layer:common',
              onlyDependOnLibsWithTags: ['layer:core'],
            },
            {
              sourceTag: 'layer:cdk',
              onlyDependOnLibsWithTags: ['layer:common', 'layer:core'],
            },
            {
              sourceTag: 'layer:analytics',
              onlyDependOnLibsWithTags: ['layer:core'],
            },
            {
              sourceTag: 'layer:design-system',
              onlyDependOnLibsWithTags: ['layer:cdk', 'layer:analytics', 'layer:common', 'layer:core'],
            },
            {
              sourceTag: 'layer:labs',
              onlyDependOnLibsWithTags: [
                'layer:design-system',
                'layer:analytics',
                'layer:cdk',
                'layer:common',
                'layer:core',
              ],
            },
            {
              sourceTag: 'layer:application',
              onlyDependOnLibsWithTags: ['layer:*'],
            },
            {
              sourceTag: 'layer:internal',
              onlyDependOnLibsWithTags: [
                'layer:labs',
                'layer:design-system',
                'layer:analytics',
                'layer:cdk',
                'layer:common',
                'layer:core',
              ],
            },
            {
              sourceTag: 'layer:tooling',
              onlyDependOnLibsWithTags: ['layer:tooling'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/.storybook/*.ts'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^@atlasng/internal/storybook$', '^(?:\\.\\./)+internal/storybook/src/index\\.ts$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
];

/**
 * ESLint configuration for Angular projects.
 * Adds the workspace's `ang` selector prefix to the shared Angular configuration.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const angularConfig = [
  ...atlasng.configs['flat/angular'],
  ...atlasng.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          style: 'kebab-case',
          prefix: 'ang',
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          style: 'camelCase',
          prefix: 'ang',
        },
      ],
    },
  },
];

/**
 * ESLint configuration for Storybook files.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const storybookConfig = [
  ...atlasng.configs['flat/storybook'],

  // TODO: Might need to set packageJsonLocation for storybook/no-uninstalled-addons
  // import.meta.resolve('./package.json') + fileURLToPath
];

export const configs = {
  base: baseConfig,
  angular: angularConfig,
  storybook: storybookConfig,
};

export default [...baseConfig, ...angularConfig, ...storybookConfig];
