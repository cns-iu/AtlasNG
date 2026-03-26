import nx from '@nx/eslint-plugin';
import json from 'eslint-plugin-jsonc';
import storybook from 'eslint-plugin-storybook';

/**
 * Base ESLint configuration for the entire monorepo.
 * Includes rules for JavaScript and TypeScript.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const baseConfig = [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/javascript'],
  ...nx.configs['flat/typescript'],
  ...json.configs['flat/base'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/package.json'],
    rules: {
      '@nx/dependency-checks': 'error',
    },
  },
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
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts', '**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
    rules: {
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'max-depth': ['error', 5],
      'max-nested-callbacks': ['error', 4],
      'no-alert': 'warn',
      'no-console': 'warn',
      'no-constructor-return': 'error',
      'no-duplicate-imports': 'error',
      'no-else-return': 'warn',
      'no-empty-function': ['error', { allow: ['arrowFunctions', 'constructors'] }],
      'no-eval': 'error',
      'no-labels': 'error',
      'no-lonely-if': 'warn',
      'no-multi-str': 'error',
      'no-proto': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'SequenceExpression',
          message: "The comma operator is confusing and a common mistake. Don't use it!",
        },
      ],
      'no-shadow': 'error',
      'no-template-curly-in-string': 'warn',
      'no-throw-literal': 'error',
      yoda: 'warn',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    rules: {
      // Disable eslint rules that interfere with typescript rules
      'no-empty-function': 'off',
      'no-shadow': 'off',

      '@typescript-eslint/array-type': 'error',
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions', 'constructors'] }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-shadow': 'error',
    },
  },
];

/**
 * ESLint configuration for Angular projects.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const angularConfig = [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
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
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/consistent-component-styles': 'error',
      '@angular-eslint/no-async-lifecycle-method': 'error',
      '@angular-eslint/no-attribute-decorator': 'error',
      '@angular-eslint/no-duplicates-in-metadata-arrays': 'error',
      '@angular-eslint/prefer-host-metadata-property': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/sort-keys-in-type-decorator': 'error',
    },
  },
  {
    files: ['**/*.html'],
    rules: {
      '@angular-eslint/template/attributes-order': [
        'error',
        {
          order: [
            'STRUCTURAL_DIRECTIVE',
            'ATTRIBUTE_BINDING',
            'INPUT_BINDING',
            'TWO_WAY_BINDING',
            'OUTPUT_BINDING',
            'TEMPLATE_REFERENCE',
          ],
        },
      ],
      '@angular-eslint/template/no-interpolation-in-attributes': 'error',
      '@angular-eslint/template/prefer-at-else': 'error',
      '@angular-eslint/template/prefer-at-empty': 'error',
      '@angular-eslint/template/prefer-contextual-for-variables': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/prefer-static-string-properties': 'error',
      '@angular-eslint/template/prefer-template-literal': 'error',
    },
  },
];

/**
 * ESLint configuration for Storybook files.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const storybookConfig = [
  ...storybook.configs['flat/recommended'],
  {
    ignores: ['!.storybook'],
  },

  // TODO: Might need to set packageJsonLocation for storybook/no-uninstalled-addons
  // import.meta.resolve('./package.json') + fileURLToPath
];

export const configs = {
  base: baseConfig,
  angular: angularConfig,
  storybook: storybookConfig,
};

export default [...baseConfig, ...angularConfig, ...storybookConfig];
