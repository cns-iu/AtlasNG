// @ts-check
import nx from '@nx/eslint-plugin';
import { coreRules, TYPESCRIPT_FILES } from './shared.js';

/**
 * Configuration for TypeScript files: the Nx TypeScript configuration, the shared core rules, and
 * TypeScript replacements for core rules that do not understand TypeScript syntax.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const config = [
  .../** @type {import('eslint').Linter.Config[]} */ (nx.configs['flat/typescript']),
  coreRules,
  {
    name: '@atlasng/typescript-rules',
    files: TYPESCRIPT_FILES,
    rules: {
      // Disable eslint rules that interfere with typescript rules
      'no-empty-function': 'off',
      'no-shadow': 'off',
      'no-unused-vars': 'off',

      '@typescript-eslint/array-type': 'error',
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions', 'constructors'] }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];

export default config;
