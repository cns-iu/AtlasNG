// @ts-check
import { createRequire } from 'node:module';
import base from './configs/base.js';

/**
 * CommonJS-style loader used by the lazy configuration getters. Node.js loads the ES module
 * configuration files synchronously through `require`, so a configuration and its dependencies are
 * only loaded when it is first accessed.
 */
const require = createRequire(import.meta.url);

/**
 * Plugin metadata read from this package's `package.json`.
 *
 * @type {{ name: string, version: string }}
 */
const packageJson = require('./package.json');

/**
 * Loads the default export of a configuration module.
 *
 * @param {string} path Path of the module relative to this file.
 * @returns {import('eslint').Linter.Config[]} The flat configuration array.
 */
function load(path) {
  return require(path).default;
}

/**
 * Flat configurations, named like their `@nx/eslint-plugin` counterparts.
 *
 * Every configuration except `flat/base` is a getter, so `angular-eslint` and
 * `eslint-plugin-storybook` are only required by workspaces that use the matching configuration.
 */
const configs = {
  'flat/base': /** @type {import('eslint').Linter.Config[]} */ (base),
  /** @returns {import('eslint').Linter.Config[]} JavaScript configuration. */
  get ['flat/javascript']() {
    return load('./configs/javascript.js');
  },
  /** @returns {import('eslint').Linter.Config[]} TypeScript configuration. */
  get ['flat/typescript']() {
    return load('./configs/typescript.js');
  },
  /** @returns {import('eslint').Linter.Config[]} Angular TypeScript configuration. */
  get ['flat/angular']() {
    return load('./configs/angular.js');
  },
  /** @returns {import('eslint').Linter.Config[]} Angular template configuration. */
  get ['flat/angular-template']() {
    return load('./configs/angular-template.js');
  },
  /** @returns {import('eslint').Linter.Config[]} Storybook configuration. */
  get ['flat/storybook']() {
    return load('./configs/storybook.js');
  },
};

/**
 * Shape of the `@atlasng/eslint-plugin` plugin object.
 *
 * @typedef {object} AtlasngEslintPlugin
 * @property {{ name: string, version: string }} meta Package name and version.
 * @property {typeof configs} configs Flat configurations keyed like `@nx/eslint-plugin`.
 * @property {Record<string, import('eslint').Rule.RuleModule>} rules Reserved for future `@atlasng/*` rules.
 */

/**
 * The `@atlasng/eslint-plugin` plugin.
 *
 * @type {AtlasngEslintPlugin}
 */
const plugin = {
  meta: { name: packageJson.name, version: packageJson.version },
  configs,
  rules: {},
};

export default plugin;
