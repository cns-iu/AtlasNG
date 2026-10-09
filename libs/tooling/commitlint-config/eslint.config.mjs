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
          // Commitlint resolves the extended config by name, and the CLI is supplied by the consumer.
          ignoredDependencies: ['@commitlint/config-conventional', '@commitlint/cli'],
        },
      ],
    },
  },
];
