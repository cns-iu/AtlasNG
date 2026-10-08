// @ts-check
import nx from '@nx/eslint-plugin';

/**
 * Configuration for TypeScript files in Angular projects: the Nx Angular configuration, selector
 * type and style checks, and additional angular-eslint rules.
 *
 * The selector rules set an empty `prefix`, which disables the prefix check. Each workspace adds
 * its own prefix by redeclaring `@angular-eslint/component-selector` and
 * `@angular-eslint/directive-selector` after this configuration.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const config = [
  .../** @type {import('eslint').Linter.Config[]} */ (nx.configs['flat/angular']),
  {
    name: '@atlasng/angular-selectors',
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          style: 'kebab-case',
          prefix: '',
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          style: 'camelCase',
          prefix: '',
        },
      ],
    },
  },
  {
    name: '@atlasng/angular-rules',
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/computed-must-return': 'error',
      '@angular-eslint/consistent-component-styles': 'error',
      '@angular-eslint/no-async-lifecycle-method': 'error',
      '@angular-eslint/no-attribute-decorator': 'error',
      '@angular-eslint/no-duplicates-in-metadata-arrays': 'error',
      '@angular-eslint/prefer-host-metadata-property': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/prefer-service-decorator': 'error',
      '@angular-eslint/prefer-signal-model': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/sort-keys-in-type-decorator': 'error',
    },
  },
];

export default config;
