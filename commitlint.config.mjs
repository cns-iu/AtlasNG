import atlasng from '@atlasng/commitlint-config';

/**
 * Commitlint configuration for AtlasNG. Extends the shared configuration and adds the `release`
 * scope used by `nx release` commits.
 *
 * @type {import('@commitlint/types').UserConfig}
 */
const config = {
  extends: ['@atlasng'],
  rules: {
    'scope-enum': async (ctx) => [2, 'always', [...atlasng.utils.getProjects(ctx), 'release']],
  },
};

export default config;
