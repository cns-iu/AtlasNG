import nxScopes from '@commitlint/config-nx-scopes';

const ADDITIONAL_SCOPES = ['release'];

/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional', '@commitlint/config-nx-scopes'],
  rules: {
    'scope-enum': async (ctx) => {
      const scopes = await nxScopes.utils.getProjects(ctx);
      return [2, 'always', [...scopes, ...ADDITIONAL_SCOPES]];
    },
  },
};

export default config;
