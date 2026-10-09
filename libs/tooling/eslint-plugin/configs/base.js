// @ts-check
import nx from '@nx/eslint-plugin';
import json from 'eslint-plugin-jsonc';

/**
 * Base configuration for every file in the workspace: the Nx base configuration, JSON parsing,
 * build output ignores, and `@nx/dependency-checks` for `package.json` files.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const config = [
  ...nx.configs['flat/base'],
  .../** @type {import('eslint').Linter.Config[]} */ (json.configs['flat/base']),
  {
    name: '@atlasng/ignores',
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    name: '@atlasng/dependency-checks',
    files: ['**/package.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/vite.config.{js,ts,mjs,mts}',
            '{projectRoot}/vitest.config.{js,ts,mjs,mts}',
            // Spec-only helpers shared between spec files; never exported from an entry point.
            '{projectRoot}/**/testing/**',
          ],
        },
      ],
    },
  },
];

export default config;
