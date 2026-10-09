// @ts-check
import nx from '@nx/eslint-plugin';
import { coreRules } from './shared.js';

/**
 * Configuration for JavaScript files: the Nx JavaScript configuration and the shared core rules.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const config = [.../** @type {import('eslint').Linter.Config[]} */ (nx.configs['flat/javascript']), coreRules];

export default config;
