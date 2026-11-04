import { configs } from '../../../eslint.config.mjs';

export default [
  ...configs.tooling,
  {
    files: ['**/package.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          // The build script and its tests only run inside the workspace; the published package has no dependencies.
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/vitest.config.{js,ts,mjs,mts}',
            '{projectRoot}/scripts/**/*',
          ],
        },
      ],
    },
  },
];
