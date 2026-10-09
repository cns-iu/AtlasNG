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
            '{projectRoot}/**/*.spec.ts',
          ],
          // Optional peers that `init` installs; their ranges are read from package.json, not imported.
          ignoredDependencies: [
            '@atlasng/commitlint-config',
            '@atlasng/eslint-plugin',
            '@atlasng/prettier-config',
            '@atlasng/tsconfig',
          ],
        },
      ],
    },
  },
  {
    files: ['**/package.json', '**/generators.json', '**/executors.json', '**/migrations.json'],
    rules: {
      '@nx/nx-plugin-checks': 'error',
    },
  },
];
