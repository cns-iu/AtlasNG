// @ts-check
import angular from './configs/angular.js';
import angularTemplate from './configs/angular-template.js';

/**
 * Angular-only entry point (`@atlasng/eslint-plugin/angular`), mirroring `@nx/eslint-plugin/angular`.
 * Importing it loads `angular-eslint` immediately.
 *
 * @type {{
 *   configs: { angular: import('eslint').Linter.Config[], 'angular-template': import('eslint').Linter.Config[] },
 *   rules: Record<string, import('eslint').Rule.RuleModule>,
 * }}
 */
const plugin = {
  configs: {
    angular,
    'angular-template': angularTemplate,
  },
  rules: {},
};

export default plugin;
