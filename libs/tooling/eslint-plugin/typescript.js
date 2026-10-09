// @ts-check
import javascript from './configs/javascript.js';
import typescript from './configs/typescript.js';

/**
 * JavaScript and TypeScript entry point (`@atlasng/eslint-plugin/typescript`), mirroring
 * `@nx/eslint-plugin/typescript`.
 *
 * @type {{
 *   configs: { javascript: import('eslint').Linter.Config[], typescript: import('eslint').Linter.Config[] },
 *   rules: Record<string, import('eslint').Rule.RuleModule>,
 * }}
 */
const plugin = {
  configs: {
    javascript,
    typescript,
  },
  rules: {},
};

export default plugin;
