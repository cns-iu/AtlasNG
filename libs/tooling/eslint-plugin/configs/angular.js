// @ts-check
import nx from '@nx/eslint-plugin';

/**
 * Configuration for TypeScript files in Angular projects: the Nx Angular configuration and additional
 * angular-eslint rules.
 *
 * Selector rules are left to each workspace, because their prefix is workspace-specific and the rule
 * options are replaced rather than merged when redeclared.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const config = [
  .../** @type {import('eslint').Linter.Config[]} */ (nx.configs['flat/angular']),
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
