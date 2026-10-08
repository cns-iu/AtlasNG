import { configs } from '../../../eslint.config.mjs';

export default [
  ...configs.base,
  {
    files: ['**/package.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/vitest.config.{js,ts,mjs,mts}',
          ],
          // Loaded indirectly by the wrapped @nx/eslint-plugin configurations, or by ESLint itself.
          ignoredDependencies: ['angular-eslint', 'eslint', 'eslint-config-prettier', 'typescript-eslint'],
        },
      ],
    },
  },
];
