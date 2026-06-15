import nxScopes from '@commitlint/config-nx-scopes';
import fs from 'node:fs/promises';
import path from 'node:path';

const ADDITIONAL_SCOPES = ['release'];
const NO_SCOPES_RESULT = [2, 'always', []];

/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': async (ctx) => {
      const cwd = ctx?.cwd || process.cwd();
      try {
        // Ensure that we are in a Nx workspace before attempting to retrieve scopes
        await fs.access(path.join(cwd, 'nx.json'), fs.constants.F_OK);
      } catch {
        return NO_SCOPES_RESULT;
      }

      const scopes = await nxScopes.utils.getProjects(ctx);
      return scopes.length > 0 ? [2, 'always', [...scopes, ...ADDITIONAL_SCOPES]] : NO_SCOPES_RESULT;
    },
  },
};

export default config;
