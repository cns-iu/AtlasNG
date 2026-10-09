import { configs } from '../../../eslint.config.mjs';

export default [
  ...configs.tooling,
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
          // Consumers load this configuration with their own Prettier installation.
          ignoredDependencies: ['prettier'],
        },
      ],
    },
  },
];
